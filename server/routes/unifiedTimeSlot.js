import express from 'express';
import {
  // Doctor requests
  requestTimeSlot,
  getMyTimeSlotRequests,
  
  // Admin management
  getAllTimeSlotsForAdmin,
  approveTimeSlot,
  rejectTimeSlot,
  getSlotsForDay,
  
  // Patient booking
  getAvailableSlotsForPatients,
  bookTimeSlot
} from '../controllers/UnifiedTimeSlotController.js';

import { authenticateDoctor } from '../middleware/auth.js';
import authenticateAdmin from '../middleware/adminAuthMiddleware.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* =================== DOCTOR ROUTES ====================== */
// Doctor requests time slot
router.post('/request', authenticateDoctor, requestTimeSlot);

// Doctor views their time slot requests
router.get('/doctor/my-requests', authenticateDoctor, getMyTimeSlotRequests);

/* =================== ADMIN ROUTES ====================== */
// Admin views all time slots
router.get('/admin/all', authenticateAdmin, getAllTimeSlotsForAdmin);

// Admin views slots for a specific day
router.get('/admin/day/:dayOfWeek', authenticateAdmin, getSlotsForDay);

// Admin approves time slot assignment
router.patch('/admin/:id/approve', authenticateAdmin, approveTimeSlot);

// Admin rejects time slot assignment
router.patch('/admin/:id/reject', authenticateAdmin, rejectTimeSlot);

/* =================== PATIENT ROUTES ====================== */
// Patients view available slots
router.get('/patient/available', protect, getAvailableSlotsForPatients);

// Patients book a specific date
router.post('/patient/book', protect, bookTimeSlot);

export default router;










