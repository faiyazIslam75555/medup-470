import express from 'express';
import { protect } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuthMiddleware.js';
import {
  requestEmergencyAccess,
  getPatientEMREmergency,
  getEmergencyAccessLogs,
  grantEmergencyPrivileges,
  revokeEmergencyPrivileges
} from '../controllers/EmergencyAccessController.js';

const router = express.Router();

// =================== DOCTOR ROUTES ======================

// POST /api/emergency/unlock - Request emergency access to patient EMR
router.post('/unlock', protect, requestEmergencyAccess);

// GET /api/emergency/patient/:patientId - Get patient EMR with emergency access
router.get('/patient/:patientId', protect, getPatientEMREmergency);

// =================== ADMIN ROUTES ======================

// GET /api/emergency/logs - Get emergency access logs (Admin only)
router.get('/logs', adminAuth, getEmergencyAccessLogs);

// POST /api/emergency/grant-privileges - Grant emergency access privileges (Admin only)
router.post('/grant-privileges', adminAuth, grantEmergencyPrivileges);

// POST /api/emergency/revoke-privileges - Revoke emergency access privileges (Admin only)
router.post('/revoke-privileges', adminAuth, revokeEmergencyPrivileges);

export default router;
