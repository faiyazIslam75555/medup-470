const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Registration Route
router.post('/register', async (req, res) => {
  const { full_name, email, password, phone, dob, gender, address, emergency_contact } = req.body;

  if (!full_name || !email || !password || !phone || !dob || !gender || !address || !emergency_contact) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ msg: 'User already exists' });

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = new User({
    full_name,
    email,
    password: hashedPassword,
    phone,
    dob,
    gender,
    address,
    emergency_contact
  });

  try {
    await newUser.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err });
  }
});

// LOGIN Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // For now, just return user info (without password)
    const userData = {
      id: user._id,
      full_name: user.full_name,
      email: user.email
    };

    res.status(200).json({ msg: 'Login successful', user: userData });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err });
  }
});

module.exports = router;
