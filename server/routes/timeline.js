import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPatientTimeline,
  getPatientTimelineSummary
} from '../controllers/TimelineController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/timeline/patient/:patientId - Get complete patient timeline
router.get('/patient/:patientId', getPatientTimeline);

// GET /api/timeline/patient/:patientId/summary - Get timeline summary
router.get('/patient/:patientId/summary', getPatientTimelineSummary);

export default router;
