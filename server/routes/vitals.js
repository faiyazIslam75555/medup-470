import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  recordVitals,
  getPatientVitals,
  getLatestVitals
} from '../controllers/VitalsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/vitals - Record new vitals
router.post('/', recordVitals);

// GET /api/vitals/patient/:id - Get patient vitals history
router.get('/patient/:id', getPatientVitals);

// GET /api/vitals/patient/:id/latest - Get latest vitals
router.get('/patient/:id/latest', getLatestVitals);

export default router;
