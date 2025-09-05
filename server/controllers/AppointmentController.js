// server/controllers/AppointmentController.js
// Complete appointment booking system

import Appointment from '../models/Appointment.js';
import UnifiedTimeSlot from '../models/UnifiedTimeSlot.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

/* =================== APPOINTMENT BOOKING ====================== */

// POST /api/appointments - Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const { scheduleId, date, reason, urgency } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!scheduleId || !date || !reason) {
      return res.status(400).json({ 
        message: 'Missing required fields: scheduleId, date, reason' 
      });
    }

    // Note: timeSlot validation is handled by the DoctorSchedule model

    // Find the doctor schedule
    const doctorSchedule = await DoctorSchedule.findById(scheduleId);
    if (!doctorSchedule) {
      return res.status(404).json({ message: 'Doctor schedule not found' });
    }

    // Check if the schedule is active
    if (doctorSchedule.status !== 'active') {
      return res.status(400).json({ message: 'This schedule is not active' });
    }

    const appointmentDate = new Date(date);
    
    // Check if the date is available in the schedule
    if (!doctorSchedule.isDateAvailable(appointmentDate)) {
      return res.status(400).json({ 
        message: 'This date is not available for booking' 
      });
    }

    // Check if appointment date matches the schedule's day of week
    const appointmentDayOfWeek = appointmentDate.getDay();
    if (appointmentDayOfWeek !== doctorSchedule.dayOfWeek) {
      return res.status(400).json({ 
        message: 'Appointment date does not match the schedule day of week' 
      });
    }

    // Check if there's already an appointment for this date and time
    const existingAppointment = await Appointment.findOne({
      doctor: doctorSchedule.doctor,
      date: appointmentDate,
      timeSlot: doctorSchedule.timeSlot,
      status: { $in: ['booked', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: 'This time slot is already booked for the selected date' 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      user: userId,
      doctor: doctorSchedule.doctor,
      date: appointmentDate,
      dayOfWeek: doctorSchedule.dayOfWeek,
      timeSlot: doctorSchedule.timeSlot,
      reason: reason.trim(),
      urgency: urgency || 'normal'
    });

    await appointment.save();

    // Mark the date as unavailable in the doctor's schedule
    await doctorSchedule.markDateUnavailable(appointmentDate, 'booked', appointment._id);

    // Populate doctor and user info for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/appointments - Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/appointments/patient/:patientId - Get appointments by patient ID (for doctors)
export const getPatientAppointmentsById = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const appointments = await Appointment.find({ user: patientId })
      .populate('doctor', 'specialty')
      .populate('user', 'name email phoneNumber')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get patient appointments by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/appointments/doctor/me - Get doctor's appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    // Get doctor ID from the authenticated user
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate('user', 'name email phoneNumber')
      .sort({ date: 1, timeSlot: 1 });

    res.json({
      appointments: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/appointments/:id - Get specific appointment
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'specialty')
      .populate('user', 'name email phoneNumber')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user owns this appointment or is the doctor
    if (appointment.user._id.toString() !== req.user._id.toString() && 
        appointment.doctor._id.toString() !== req.user.doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/appointments/:id - Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { date, time, reason, urgency } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only update booked appointments
    if (appointment.status !== 'booked') {
      return res.status(400).json({ 
        message: 'Can only update booked appointments' 
      });
    }

    // Update fields
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (reason) appointment.reason = reason.trim();
    if (urgency) appointment.urgency = urgency;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/appointments/:id - Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Release the date in the doctor's schedule
    const doctorSchedule = await DoctorSchedule.findOne({
      doctor: appointment.doctor,
      dayOfWeek: appointment.dayOfWeek,
      timeSlot: appointment.timeSlot
    });

    if (doctorSchedule) {
      await doctorSchedule.markDateAvailable(appointment.date);
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/appointments/:id/complete - Mark appointment as completed (for doctors)
export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is the doctor for this appointment
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || doctor._id.toString() !== appointment.doctor.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment status
    appointment.status = 'completed';
    await appointment.save();

    // Release the date in the doctor's schedule
    const doctorSchedule = await DoctorSchedule.findOne({
      doctor: appointment.doctor,
      dayOfWeek: appointment.dayOfWeek,
      timeSlot: appointment.timeSlot
    });

    if (doctorSchedule) {
      await doctorSchedule.markDateAvailable(appointment.date);
    }

    res.json({ message: 'Appointment marked as completed successfully' });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export default {
  createAppointment,
  getPatientAppointments,
  getPatientAppointmentsById,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  completeAppointment
};
