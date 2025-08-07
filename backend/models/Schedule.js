const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  start_time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM) and range (08:00 to 12:00)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(v)) return false;
        
        const [hours, minutes] = v.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        
        // Check if time is between 8:00 AM (480 minutes) and 12:00 PM (720 minutes)
        return totalMinutes >= 480 && totalMinutes <= 720;
      },
      message: 'Start time must be between 08:00 and 12:00'
    }
  },
  end_time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM) and range (08:00 to 12:00)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(v)) return false;
        
        const [hours, minutes] = v.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        
        // Check if time is between 8:00 AM (480 minutes) and 12:00 PM (720 minutes)
        return totalMinutes >= 480 && totalMinutes <= 720;
      },
      message: 'End time must be between 08:00 and 12:00'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
scheduleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for efficient querying
scheduleSchema.index({ doctor: 1, day: 1, start_time: 1, end_time: 1 });
scheduleSchema.index({ day: 1, start_time: 1, end_time: 1 });

// Static method to check for time conflicts
scheduleSchema.statics.checkTimeConflict = async function(doctorId, day, startTime, endTime, excludeId = null) {
  const query = {
    doctor: doctorId,
    day: day,
    status: 'active',
    $or: [
      // New schedule starts during existing schedule
      {
        start_time: { $lte: startTime },
        end_time: { $gt: startTime }
      },
      // New schedule ends during existing schedule
      {
        start_time: { $lt: endTime },
        end_time: { $gte: endTime }
      },
      // New schedule completely contains existing schedule
      {
        start_time: { $gte: startTime },
        end_time: { $lte: endTime }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflicts = await this.find(query);
  return conflicts.length > 0;
};

// Static method to get available time slots for a day
scheduleSchema.statics.getAvailableSlots = async function(day) {
  const bookedSlots = await this.find({
    day: day,
    status: 'active'
  }).sort({ start_time: 1 });

  const allSlots = [];
  const startHour = 8; // 8 AM
  const endHour = 12; // 12 PM
  const slotDuration = 60; // 1 hour slots

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // Check if this slot is available
    const isBooked = bookedSlots.some(slot => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return (startTime >= slotStart && startTime < slotEnd) ||
             (endTime > slotStart && endTime <= slotEnd) ||
             (startTime <= slotStart && endTime >= slotEnd);
    });

    if (!isBooked) {
      allSlots.push({
        start_time: startTime,
        end_time: endTime,
        available: true
      });
    }
  }

  return allSlots;
};

// Static method to get doctor's schedule
scheduleSchema.statics.getDoctorSchedule = async function(doctorId) {
  return await this.find({
    doctor: doctorId,
    status: 'active'
  }).populate('doctor', 'name specialty').sort({ day: 1, start_time: 1 });
};

// Static method to get all schedules for a specific day
scheduleSchema.statics.getDaySchedule = async function(day) {
  return await this.find({
    day: day,
    status: 'active'
  }).populate('doctor', 'name specialty department').sort({ start_time: 1 });
};

module.exports = mongoose.model('Schedule', scheduleSchema);

