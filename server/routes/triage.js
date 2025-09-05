// routes/triage.js
// Triage system routes for symptom search and specialty recommendation

import express from 'express';
import { getSymptomSuggestions, searchBySymptoms, getAvailableSpecialtiesEndpoint } from '../controllers/triageController.js';

const router = express.Router();

// GET /api/triage/symptoms?query=cou
router.get('/symptoms', getSymptomSuggestions);

// GET /api/triage/specialties
router.get('/specialties', getAvailableSpecialtiesEndpoint);

// POST /api/triage/search
router.post('/search', searchBySymptoms);

export default router;
