const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Book an appointment
router.post('/book', async (req, res) => {
  const { doctorId, patientId, day, start, end } = req.body;
  
  try {
    // Validate required fields
    if (!doctorId || !patientId || !day || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      day: day,
      start: start,
      end: end,
      status: "booked"
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Create new appointment
    const appointment = new Appointment({
      doctor: doctorId,
      patient: patientId,
      day: day,
      start: start,
      end: end,
      status: "booked"
    });

    await appointment.save();

    // Update doctor's slot to booked
    await Doctor.updateOne(
      { 
        _id: doctorId,
        'available_slots.day': day,
        'available_slots.start': start,
        'available_slots.end': end
      },
      { 
        $set: { 'available_slots.$.isBooked': true }
      }
    );

    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        doctor: doctor.name,
        patient: patient.full_name,
        day: day,
        start: start,
        end: end,
        status: "booked"
      }
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get all appointments for a patient
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  
  try {
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name specialty')
      .populate('patient', 'full_name email')
      .sort({ created_at: -1 });

    res.json({
      appointments: appointments.map(app => ({
        id: app._id,
        doctor: app.doctor.name,
        specialty: app.doctor.specialty,
        day: app.day,
        start: app.start,
        end: app.end,
        status: app.status,
        created_at: app.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Cancel an appointment
router.put('/:appointmentId/cancel', async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment status
    appointment.status = "cancelled";
    await appointment.save();

    // Update doctor's slot to available
    await Doctor.updateOne(
      { 
        _id: appointment.doctor,
        'available_slots.day': appointment.day,
        'available_slots.start': appointment.start,
        'available_slots.end': appointment.end
      },
      { 
        $set: { 'available_slots.$.isBooked': false }
      }
    );

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router; 