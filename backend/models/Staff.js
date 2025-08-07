const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['doctor', 'nurse', 'receptionist', 'admin'] 
  },
  specialty: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Specialty',
    required: function() { return this.role === 'doctor'; }
  },
  experience_years: { 
    type: Number,
    min: 0,
    required: function() { return this.role === 'doctor'; }
  },
  department: { 
    type: String, 
    required: true 
  },
  qualification: { 
    type: String, 
    required: true 
  },
  license_number: { 
    type: String,
    required: function() { return this.role === 'doctor' || this.role === 'nurse'; }
  },
  hire_date: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  salary: { 
    type: Number,
    min: 0 
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive', 'on_leave'] 
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
staffSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Staff', staffSchema);

