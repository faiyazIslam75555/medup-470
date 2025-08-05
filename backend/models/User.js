const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  emergency_contact: {
    name: { type: String, required: true },
    phone: { type: String, required: true }
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
