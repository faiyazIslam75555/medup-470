// routes/aiRisk.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { findRiskiestPatient, suggestAppointment } from '../controllers/aiRiskController.js';

const router = express.Router();

// Find the riskiest patient from all patients
router.get('/riskiest-patient', protect, findRiskiestPatient);

// Suggest appointment for a patient
router.post('/suggest-appointment', protect, suggestAppointment);

export default router;
