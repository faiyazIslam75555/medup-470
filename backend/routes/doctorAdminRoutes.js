const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

// GET all doctors (only unbooked slots included)
router.get('/', async (req, res) => {
  const docs = await Doctor.find({}).populate('specialty');
  // For each doctor, only include unbooked slots
  const docsWithUnbookedSlots = docs.map(doc => {
    const d = doc.toObject();
    d.available_slots = (d.available_slots || []).filter(slot => !slot.isBooked);
    return d;
  });
  res.json(docsWithUnbookedSlots);
});

// Add/Approve a doctor
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
router.put('/:id/slots', async (req, res) => {
  const { available_slots } = req.body;

  // Check for duplicate slots in request
  const uniqueSlots = [];
  const slotSet = new Set();
  let duplicateFound = false;

  for (const slot of available_slots) {
    const key = `${slot.day}_${slot.start}_${slot.end}`;
    if (slotSet.has(key)) {
      duplicateFound = true;
      continue; // skip duplicates
    }
    slotSet.add(key);
    uniqueSlots.push(slot);
  }

  // Check if any requested slot is already booked for this doctor in DB
  const doctor = await Doctor.findById(req.params.id);
  const alreadyBooked = [];
  for (const slot of uniqueSlots) {
    const match = (doctor.available_slots || []).find(
      s => s.day === slot.day && s.start === slot.start && s.end === slot.end && s.isBooked
    );
    if (match) alreadyBooked.push(`${slot.day} ${slot.start}-${slot.end}`);
  }

  if (alreadyBooked.length > 0) {
    return res.status(400).json({
      msg: `Cannot assign slots: already booked: ${alreadyBooked.join(', ')}`
    });
  }

  if (duplicateFound) {
    return res.status(400).json({ msg: "Duplicate slots in request. Only unique slots are allowed." });
  }

  // Assign only unique and not already booked slots
  doctor.available_slots = uniqueSlots;
  await doctor.save();
  res.json({ msg: "Slots assigned", available_slots: doctor.available_slots });
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

// GET /api/admin/doctors/:id/unbooked-slots
router.get('/:id/unbooked-slots', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ msg: "Doctor not found" });
    const unbookedSlots = (doctor.available_slots || []).filter(slot => !slot.isBooked);
    res.json(unbookedSlots);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
