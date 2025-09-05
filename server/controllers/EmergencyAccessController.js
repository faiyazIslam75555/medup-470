import EmergencyAccessLog from '../models/EmergencyAccessLog.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST /api/emergency/unlock - Request emergency access to patient EMR
export const requestEmergencyAccess = async (req, res) => {
  try {
    const { patientId, reason, password } = req.body;
    const doctorId = req.user._id;
    const sessionId = req.sessionID || crypto.randomUUID();

    // Validate required fields
    if (!patientId || !reason || !password) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, reason, and password are required'
      });
    }

    // Check if doctor has emergency access privileges
    const doctor = await Doctor.findOne({ user: doctorId }).populate('user');
    if (!doctor || !doctor.hasEmergencyAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have emergency access privileges. Contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, doctor.user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please re-enter your password.'
      });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check for recent emergency access (prevent abuse)
    const recentAccess = await EmergencyAccessLog.findOne({
      doctor: doctor._id,
      patient: patientId,
      status: 'granted',
      accessedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
    });

    if (recentAccess) {
      return res.status(429).json({
        success: false,
        message: 'Emergency access already granted for this patient in the last 30 minutes'
      });
    }

    // Create emergency access log
    const emergencyLog = new EmergencyAccessLog({
      doctor: doctor._id,
      patient: patientId,
      reason: reason.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: sessionId,
      passwordVerified: true
    });

    await emergencyLog.save();

    // Log the emergency access
    console.log(`🚨 EMERGENCY ACCESS GRANTED: Dr. ${doctor.user.name} accessed patient ${patient.name} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Emergency access granted successfully',
      accessLog: {
        id: emergencyLog._id,
        patientId: patientId,
        patientName: patient.name,
        reason: reason,
        accessedAt: emergencyLog.accessedAt,
        expiresAt: emergencyLog.expiredAt,
        duration: emergencyLog.duration
      },
      warning: 'All emergency access is permanently logged and monitored by admin.'
    });

  } catch (error) {
    console.error('Emergency access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during emergency access'
    });
  }
};

// GET /api/emergency/patient/:patientId - Get patient EMR with emergency access
export const getPatientEMREmergency = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    // Check if doctor has emergency access privileges
    const doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor || !doctor.hasEmergencyAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have emergency access privileges'
      });
    }

    // Check for active emergency access
    const activeAccess = await EmergencyAccessLog.findOne({
      doctor: doctor._id,
      patient: patientId,
      status: 'granted',
      expiredAt: { $gt: new Date() }
    }).sort({ accessedAt: -1 });

    if (!activeAccess) {
      return res.status(403).json({
        success: false,
        message: 'No active emergency access for this patient. Please request emergency access first.'
      });
    }

    // Get patient EMR data
    const patient = await User.findById(patientId)
      .select('-password')
      .populate('appointments')
      .populate('prescriptions');

    // Get additional EMR data (timeline, vitals, etc.)
    const EMR = (await import('../models/EMR.js')).default;
    const emr = await EMR.findOne({ patient: patientId });

    res.json({
      success: true,
      message: 'Emergency access to patient EMR granted',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address
      },
      emr: emr || null,
      appointments: patient.appointments || [],
      prescriptions: patient.prescriptions || [],
      emergencyAccess: {
        reason: activeAccess.reason,
        accessedAt: activeAccess.accessedAt,
        expiresAt: activeAccess.expiredAt,
        remainingTime: Math.max(0, Math.round((activeAccess.expiredAt - new Date()) / (1000 * 60)))
      },
      warning: 'This is emergency access. All actions are logged and monitored.'
    });

  } catch (error) {
    console.error('Get patient EMR emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accessing patient EMR'
    });
  }
};

// GET /api/emergency/logs - Get emergency access logs (Admin only)
export const getEmergencyAccessLogs = async (req, res) => {
  try {
    console.log('🔍 Emergency Access Logs: Request received');
    console.log('🔍 Emergency Access Logs: User:', req.user);
    console.log('🔍 Emergency Access Logs: Headers:', req.headers);
    
    const { page = 1, limit = 20, status, doctorId, patientId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;

    // Get logs with pagination
    const logs = await EmergencyAccessLog.find(query)
      .populate('doctor', 'user')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('patient', 'name email')
      .sort({ accessedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalLogs = await EmergencyAccessLog.countDocuments(query);

    // Get statistics
    const stats = await EmergencyAccessLog.aggregate([
      {
        $group: {
          _id: null,
          totalAccesses: { $sum: 1 },
          grantedAccesses: {
            $sum: { $cond: [{ $eq: ['$status', 'granted'] }, 1, 0] }
          },
          deniedAccesses: {
            $sum: { $cond: [{ $eq: ['$status', 'denied'] }, 1, 0] }
          },
          expiredAccesses: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      logs: logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs: totalLogs,
        hasNext: skip + logs.length < totalLogs,
        hasPrev: page > 1
      },
      statistics: stats[0] || {
        totalAccesses: 0,
        grantedAccesses: 0,
        deniedAccesses: 0,
        expiredAccesses: 0
      }
    });

  } catch (error) {
    console.error('Get emergency access logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching emergency access logs'
    });
  }
};

// POST /api/emergency/grant-privileges - Grant emergency access privileges to doctor (Admin only)
export const grantEmergencyPrivileges = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const adminId = req.user._id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update doctor with emergency access privileges
    doctor.hasEmergencyAccess = true;
    doctor.emergencyAccessGrantedBy = adminId;
    doctor.emergencyAccessGrantedAt = new Date();
    await doctor.save();

    console.log(`🔓 EMERGENCY ACCESS PRIVILEGES GRANTED: Admin ${adminId} granted emergency access to Dr. ${doctor.user?.name || doctorId}`);

    res.json({
      success: true,
      message: 'Emergency access privileges granted successfully',
      doctor: {
        id: doctor._id,
        hasEmergencyAccess: doctor.hasEmergencyAccess,
        grantedAt: doctor.emergencyAccessGrantedAt
      }
    });

  } catch (error) {
    console.error('Grant emergency privileges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while granting emergency privileges'
    });
  }
};

// POST /api/emergency/revoke-privileges - Revoke emergency access privileges from doctor (Admin only)
export const revokeEmergencyPrivileges = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const adminId = req.user._id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Revoke emergency access privileges
    doctor.hasEmergencyAccess = false;
    doctor.emergencyAccessGrantedBy = null;
    doctor.emergencyAccessGrantedAt = null;
    await doctor.save();

    console.log(`🔒 EMERGENCY ACCESS PRIVILEGES REVOKED: Admin ${adminId} revoked emergency access from Dr. ${doctor.user?.name || doctorId}`);

    res.json({
      success: true,
      message: 'Emergency access privileges revoked successfully',
      doctor: {
        id: doctor._id,
        hasEmergencyAccess: doctor.hasEmergencyAccess
      }
    });

  } catch (error) {
    console.error('Revoke emergency privileges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while revoking emergency privileges'
    });
  }
};
