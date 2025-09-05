import mongoose from 'mongoose';

const emergencyAccessLogSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    accessType: {
      type: String,
      enum: ['emergency_unlock'],
      default: 'emergency_unlock'
    },
    status: {
      type: String,
      enum: ['granted', 'denied', 'expired'],
      default: 'granted'
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    // Audit fields
    accessedAt: {
      type: Date,
      default: Date.now
    },
    expiredAt: {
      type: Date,
      default: function() {
        // Emergency access expires after 2 hours
        return new Date(Date.now() + 2 * 60 * 60 * 1000);
      }
    },
    // Additional security fields
    passwordVerified: {
      type: Boolean,
      default: true
    },
    sessionId: {
      type: String,
      required: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient queries
emergencyAccessLogSchema.index({ doctor: 1, accessedAt: -1 });
emergencyAccessLogSchema.index({ patient: 1, accessedAt: -1 });
emergencyAccessLogSchema.index({ status: 1, accessedAt: -1 });

// Virtual for duration
emergencyAccessLogSchema.virtual('duration').get(function() {
  if (this.expiredAt) {
    return Math.round((this.expiredAt - this.accessedAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for isExpired
emergencyAccessLogSchema.virtual('isExpired').get(function() {
  return this.expiredAt && new Date() > this.expiredAt;
});

export default mongoose.model('EmergencyAccessLog', emergencyAccessLogSchema);









