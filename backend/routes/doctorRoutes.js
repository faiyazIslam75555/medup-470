const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

router.get('/:doctorId/homepage', async (req, res) => {
  const { doctorId } = req.params;
  const today = new Date();
  const dayStr = today.toLocaleString('en-US', { weekday: 'long' });

  const appointments = await Appointment.find({
    doctor: doctorId,
    day: dayStr,
    status: "booked"
  }).populate('patient');

  res.json({
    doctorId,
    today: dayStr,
    numAppointments: appointments.length,
    patients: appointments.map(app => ({
      id: app.patient._id,
      name: app.patient.full_name,
      email: app.patient.email,
      slot: { start: app.start, end: app.end }
    }))
  });
});

// New route to get appointments by specific date
router.get('/:doctorId/appointments/:date', async (req, res) => {
  const { doctorId, date } = req.params;
  
  try {
    // Convert date string to day name
    const selectedDate = new Date(date);
    const dayStr = selectedDate.toLocaleString('en-US', { weekday: 'long' });

    const appointments = await Appointment.find({
      doctor: doctorId,
      day: dayStr,
      status: "booked"
    }).populate('patient').sort({ start: 1 });

    res.json({
      doctorId,
      date: date,
      day: dayStr,
      numAppointments: appointments.length,
      patients: appointments.map(app => ({
        id: app.patient._id,
        name: app.patient.full_name,
        email: app.patient.email,
        slot: { start: app.start, end: app.end }
      }))
    });
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get doctor details and available slots
router.get('/:doctorId/details', async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    const doctor = await Doctor.findById(doctorId).populate('specialty', 'name');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Get available slots (not booked)
    const availableSlots = doctor.available_slots.filter(slot => !slot.isBooked);

    res.json({
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
        experience_years: doctor.experience_years,
        department: doctor.department
      },
      availableSlots
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  }
});

module.exports = router;
