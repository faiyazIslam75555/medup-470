import express from 'express';
import { registerUser, loginUser, getUserProfile, getAllUsers } from '../controllers/UserController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all', getAllUsers); // Public endpoint for emergency access

// Protected route
router.get('/profile', protect, getUserProfile);

export default router;
