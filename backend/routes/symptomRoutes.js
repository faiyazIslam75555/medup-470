const express = require('express');
const router = express.Router();

const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');

// ---- Configurable options ----
const MATCH_THRESHOLD = 2; // symptoms needed to recommend a specialist

// ---- Synonym Map (expand as needed) ----
const synonymMap = {
  "pain in eye": "eye pain",
  "head ache": "headache",
  "stomach pain": "abdominal pain",
  "weak": "weakness",
  // Add more!
};

// ---- Logging: For analytics & future expansion ----
let unknownSymptomsLog = []; // In-memory for demo

// POST /api/symptoms/search
router.post('/search', async (req, res) => {
  let { symptoms } = req.body;
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ msg: "Please provide at least one symptom." });
  }

  // 1. Normalize & synonym mapping
  let normalizedSymptoms = symptoms.map(sym => {
    if (synonymMap[sym]) return synonymMap[sym];
    // Log unknown symptoms for analytics
    if (!Object.keys(synonymMap).includes(sym)) {
      unknownSymptomsLog.push(sym);
    }
    return sym;
  });

  // 2. Fetch all specialties from DB
  const specialties = await Specialty.find({});
  let maxMatch = 0;
  let matchedSpecialties = [];

  // 3. Matching logic: Count overlap for each specialty
  specialties.forEach(spec => {
    // For robust match, compare in lower case
    const specSymSet = spec.symptoms.map(s => s.toLowerCase());
    const count = normalizedSymptoms.filter(sym =>
      specSymSet.includes(sym.toLowerCase())
    ).length;

    if (count >= MATCH_THRESHOLD) {
      if (count > maxMatch) {
        maxMatch = count;
        matchedSpecialties = [{ name: spec.name, match_count: count, _id: spec._id }];
      } else if (count === maxMatch) {
        matchedSpecialties.push({ name: spec.name, match_count: count, _id: spec._id });
      }
    }
  });

  // 4. If nothing meets threshold, default to General Medicine
  if (matchedSpecialties.length === 0) {
    const genMed = specialties.find(s => s.name.toLowerCase() === "general medicine");
    if (genMed) matchedSpecialties = [{ name: genMed.name, match_count: 0, _id: genMed._id }];
  }

  // 5. Find all doctors for matched specialties
  const specialtyIds = matchedSpecialties.map(s => s._id);
  const doctors = await Doctor.find({ specialty: { $in: specialtyIds } }).populate('specialty', 'name');

  const recommended_doctors = doctors.map(d => ({
    name: d.name,
    specialty: d.specialty.name
  }));

  // 6. Response (NO message field!)
  res.json({
    matched_specialties: matchedSpecialties.map(s => ({
      name: s.name, match_count: s.match_count
    })),
    recommended_doctors
  });
});

// GET /api/symptoms/doctors-by-specialty?name=Cardiology
router.get('/doctors-by-specialty', async (req, res) => {
  const specialtyName = req.query.name;
  if (!specialtyName) {
    return res.status(400).json({ msg: "Please provide a specialty name (e.g., ?name=Cardiology)" });
  }
  try {
    const specialty = await Specialty.findOne({ name: specialtyName });
    if (!specialty) return res.status(404).json({ msg: "Specialty not found." });

    const doctors = await Doctor.find({ specialty: specialty._id }).populate('specialty', 'name');
    res.json({ doctors: doctors.map(d => ({ name: d.name, specialty: d.specialty.name })) });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching doctors.", error: err.message });
  }
});

// POST /api/symptoms/doctors-by-specialty
router.post('/doctors-by-specialty', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ msg: "Please provide a specialty name in the body." });
  }
  try {
    const specialty = await Specialty.findOne({ name });
    if (!specialty) return res.status(404).json({ msg: "Specialty not found." });

    const doctors = await Doctor.find({ specialty: specialty._id }).populate('specialty', 'name');
    res.json({ doctors: doctors.map(d => ({ name: d.name, specialty: d.specialty.name })) });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching doctors.", error: err.message });
  }
});

// (Optional) GET all unknown symptoms for analytics
router.get('/unknown-symptoms-log', (req, res) => {
  res.json({ unknownSymptomsLog });
});

// GET /api/symptoms/specialties -- returns all specialties (name and _id)

router.get('/specialties', async (req, res) => {
  try {
    const specialties = await Specialty.find({});
    res.json(specialties);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;
