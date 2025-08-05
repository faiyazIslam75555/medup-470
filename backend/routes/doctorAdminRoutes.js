const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

// List all doctors
router.get('/', async (req, res) => {
  const doctors = await Doctor.find({}).populate('specialty');
  res.json(doctors);
});

// Approve/add doctor
router.post('/', async (req, res) => {
  try {
    const { name, specialtyId, experience_years, department, available_slots } = req.body;
    const doctor = new Doctor({
      name,
      specialty: specialtyId,
      experience_years,
      department,
      available_slots
    });
    await doctor.save();
    res.status(201).json({ msg: "Doctor approved & added", doctor });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// Assign department
router.put('/:id/department', async (req, res) => {
  const { department } = req.body;
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { department }, { new: true });
  res.json(doctor);
});

// Assign/overwrite slots
router.put('/:id/slots', async (req, res) => {
  const { available_slots } = req.body;
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { available_slots }, { new: true });
  res.json(doctor);
});

// Book a slot
router.put('/:id/slots/book', async (req, res) => {
  const { day, start, end } = req.body;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ msg: "Doctor not found" });

  const slot = doctor.available_slots.find(
    (s) => s.day === day && s.start === start && s.end === end
  );
  if (!slot) return res.status(404).json({ msg: "Slot not found" });
  if (slot.isBooked) return res.status(400).json({ msg: "Slot already booked" });

  slot.isBooked = true;
  await doctor.save();
  res.json({ msg: "Slot booked", doctor });
});

module.exports = router;
