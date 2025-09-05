import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import EMR from '../models/EMR.js';

// GET /api/timeline/patient/:patientId - Get patient's complete health timeline
export const getPatientTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Fetch appointments
    const appointments = await Appointment.find({ user: patientId })
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ date: 1, timeSlot: 1 });

    // Fetch prescriptions
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name email')
      .populate('prescribedMedicines.medicineId', 'name price quantity')
      .sort({ createdAt: 1 });

    // Fetch vitals from EMR
    const emr = await EMR.findOne({ patient: patientId });
    const vitals = emr ? emr.vitals || [] : [];

    // Combine all data into timeline events
    const timelineEvents = [];

    // Add appointments
    appointments.forEach(appointment => {
      timelineEvents.push({
        type: 'appointment',
        date: appointment.date,
        title: 'Doctor Appointment',
        description: `Appointment with Dr. ${appointment.doctor?.user?.name || 'Unknown'} - ${appointment.doctor?.specialty || 'General'}`,
        status: appointment.status,
        data: appointment
      });
    });

    // Add prescriptions
    prescriptions.forEach(prescription => {
      timelineEvents.push({
        type: 'prescription',
        date: prescription.createdAt,
        title: 'Prescription Issued',
        description: `Prescription for ${prescription.disease || 'Medical condition'} by Dr. ${prescription.doctor?.name || 'Unknown'}`,
        status: 'active',
        data: prescription
      });
    });

    // Add vitals
    vitals.forEach(vital => {
      timelineEvents.push({
        type: 'vitals',
        date: vital.date,
        title: 'Vitals Recorded',
        description: `BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}, HR: ${vital.heartRate} bpm, Temp: ${vital.temperature}°F, Weight: ${vital.weight} lbs`,
        status: 'recorded',
        data: vital
      });
    });

    // Sort all events by date (newest first)
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      patientId,
      timeline: timelineEvents,
      summary: {
        totalEvents: timelineEvents.length,
        appointments: appointments.length,
        prescriptions: prescriptions.length,
        vitals: vitals.length
      }
    });

  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patient timeline' 
    });
  }
};

// GET /api/timeline/patient/:patientId/summary - Get timeline summary
export const getPatientTimelineSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get counts for summary
    const appointmentCount = await Appointment.countDocuments({ user: patientId });
    const prescriptionCount = await Prescription.countDocuments({ patient: patientId });
    
    const emr = await EMR.findOne({ patient: patientId });
    const vitalsCount = emr ? emr.vitals?.length || 0 : 0;

    // Get latest events
    const latestAppointment = await Appointment.findOne({ user: patientId })
      .sort({ date: -1 })
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name'
        }
      });

    const latestPrescription = await Prescription.findOne({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate('doctor', 'name');

    const latestVitals = emr?.vitals?.length > 0 ? 
      emr.vitals.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;

    res.json({
      success: true,
      patientId,
      summary: {
        totalEvents: appointmentCount + prescriptionCount + vitalsCount,
        appointments: appointmentCount,
        prescriptions: prescriptionCount,
        vitals: vitalsCount
      },
      latest: {
        appointment: latestAppointment ? {
          date: latestAppointment.date,
          doctor: latestAppointment.doctor?.user?.name,
          specialty: latestAppointment.doctor?.specialty
        } : null,
        prescription: latestPrescription ? {
          date: latestPrescription.createdAt,
          disease: latestPrescription.disease,
          doctor: latestPrescription.doctor?.name
        } : null,
        vitals: latestVitals ? {
          date: latestVitals.date,
          bloodPressure: latestVitals.bloodPressure,
          heartRate: latestVitals.heartRate,
          temperature: latestVitals.temperature,
          weight: latestVitals.weight
        } : null
      }
    });

  } catch (error) {
    console.error('Get patient timeline summary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch timeline summary' 
    });
  }
};
