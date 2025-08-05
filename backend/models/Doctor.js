const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  isBooked: { type: Boolean, default: false }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
  experience_years: { type: Number, required: true },
  department: { type: String, required: true },
  available_slots: [slotSchema],
  status: { type: String, default: "active" }
});

module.exports = mongoose.model('Doctor', doctorSchema);
