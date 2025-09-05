import mongoose from 'mongoose';

const appointmentSuggestionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  suggestedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  patientResponse: {
    type: String,
    enum: ['none', 'accepted', 'declined'],
    default: 'none'
  },
  respondedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSuggestionSchema.index({ patient: 1, status: 1 });
appointmentSuggestionSchema.index({ doctor: 1, status: 1 });
appointmentSuggestionSchema.index({ expiresAt: 1 });

export default mongoose.model('AppointmentSuggestion', appointmentSuggestionSchema);










