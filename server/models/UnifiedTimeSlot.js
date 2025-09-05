import mongoose from 'mongoose';

// Unified Time Slot System
// This replaces the conflicting TimeSlot and DoctorSchedule systems
const unifiedTimeSlotSchema = new mongoose.Schema({
  // Basic slot information
  dayOfWeek: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday, 1=Monday, etc.
    required: true
  },
  timeSlot: {
    type: String,
    enum: ['8-12', '12-4', '4-8', '20-00'],
    required: true
  },
  
  // Doctor assignment (permanent)
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  
  // Status: AVAILABLE (no doctor), ASSIGNED (doctor assigned), BOOKED (patient booked specific date)
  status: {
    type: String,
    enum: ['AVAILABLE', 'ASSIGNED', 'BOOKED'],
    default: 'AVAILABLE'
  },
  
  // Admin approval for doctor assignment
  assignedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Notes for the slot
  notes: {
    type: String,
    trim: true
  },
  
  // Track specific dates when patients have booked this slot
  bookedDates: [{
    date: {
      type: Date,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['booked', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'booked'
    },
    bookedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Unique index: one slot per day per time
unifiedTimeSlotSchema.index({ dayOfWeek: 1, timeSlot: 1 }, { unique: true });

// Index for doctor queries
unifiedTimeSlotSchema.index({ doctor: 1, status: 1 });

// Index for date queries
unifiedTimeSlotSchema.index({ 'bookedDates.date': 1 });

// Helper method to check if a specific date is available for booking
unifiedTimeSlotSchema.methods.isDateAvailable = function(date) {
  if (this.status !== 'ASSIGNED') {
    return false; // Only assigned slots can be booked
  }
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Check if this date is already booked
  return !this.bookedDates.some(booking => {
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === targetDate.getTime() && 
           ['booked', 'confirmed'].includes(booking.status);
  });
};

// Helper method to book a specific date
unifiedTimeSlotSchema.methods.bookDate = async function(date, patientId, appointmentId, reason = '') {
  if (!this.isDateAvailable(date)) {
    throw new Error('Date is not available for booking');
  }
  
  this.bookedDates.push({
    date: new Date(date),
    patient: patientId,
    appointmentId: appointmentId,
    reason: reason,
    status: 'booked'
  });
  
  // Update overall status if this is the first booking
  if (this.status === 'ASSIGNED') {
    this.status = 'BOOKED';
  }
  
  await this.save();
  return this;
};

// Helper method to get available dates for a date range
unifiedTimeSlotSchema.methods.getAvailableDates = function(startDate, endDate) {
  const availableDates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    if (current.getDay() === this.dayOfWeek && this.isDateAvailable(current)) {
      availableDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return availableDates;
};

// Static method to get all slots for admin dashboard
unifiedTimeSlotSchema.statics.getAllSlotsForAdmin = function() {
  return this.find()
    .populate('doctor', 'specialty')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('approvedBy', 'name email')
    .sort({ dayOfWeek: 1, timeSlot: 1 });
};

// Static method to get available slots for patients
unifiedTimeSlotSchema.statics.getAvailableSlotsForPatients = function(startDate, endDate) {
  return this.find({ status: 'ASSIGNED' })
    .populate('doctor', 'specialty')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .sort({ dayOfWeek: 1, timeSlot: 1 });
};

export default mongoose.model('UnifiedTimeSlot', unifiedTimeSlotSchema);










