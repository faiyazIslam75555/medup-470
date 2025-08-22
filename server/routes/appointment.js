// server/routes/appointment.js
// Appointment booking routes

import express from 'express';
import { protect, authenticateDoctor } from '../middleware/auth.js';
import {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getPatientAppointmentsById,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
} from '../controllers/AppointmentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Patient routes
router.post('/', createAppointment);                           // POST /api/appointments
router.get('/', getPatientAppointments);                       // GET /api/appointments
router.get('/patient/:patientId', getPatientAppointmentsById); // GET /api/appointments/patient/:patientId
router.get('/:id', getAppointmentById);                        // GET /api/appointments/:id
router.put('/:id', updateAppointment);                         // PUT /api/appointments/:id
router.delete('/:id', cancelAppointment);                      // DELETE /api/appointments/:id

// Doctor routes (require doctor authentication)
router.get('/doctor/me', authenticateDoctor, getDoctorAppointments);  // GET /api/appointments/doctor/me

export default router;
