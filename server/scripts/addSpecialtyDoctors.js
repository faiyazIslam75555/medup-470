// Script to add doctors with different medical specialties
// Run with: node scripts/addSpecialtyDoctors.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
const User = (await import('../models/User.js')).default;
const Doctor = (await import('../models/Doctor.js')).default;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medup';

// Sample doctors with different specialties
const specialtyDoctors = [
  {
    name: 'Dr. Sarah Chen',
    email: 'dr.chen@medup.com',
    phoneNumber: '+1-555-0101',
    password: 'password123',
    specialty: 'Neurology',
    department: 'Neurology Department'
  },
  {
    name: 'Dr. Michael Rodriguez',
    email: 'dr.rodriguez@medup.com',
    phoneNumber: '+1-555-0102',
    password: 'password123',
    specialty: 'Orthopedics',
    department: 'Orthopedics Department'
  },
  {
    name: 'Dr. Emily Johnson',
    email: 'dr.johnson@medup.com',
    phoneNumber: '+1-555-0103',
    password: 'password123',
    specialty: 'Cardiology',
    department: 'Cardiology Department'
  },
  {
    name: 'Dr. David Kim',
    email: 'dr.kim@medup.com',
    phoneNumber: '+1-555-0104',
    password: 'password123',
    specialty: 'Dermatology',
    department: 'Dermatology Department'
  },
  {
    name: 'Dr. Lisa Thompson',
    email: 'dr.thompson@medup.com',
    phoneNumber: '+1-555-0105',
    password: 'password123',
    specialty: 'Gastroenterology',
    department: 'Gastroenterology Department'
  },
  {
    name: 'Dr. James Wilson',
    email: 'dr.wilson@medup.com',
    phoneNumber: '+1-555-0106',
    password: 'password123',
    specialty: 'Pulmonology',
    department: 'Pulmonology Department'
  }
];

async function addSpecialtyDoctors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing specialty doctors (optional - comment out if you want to keep existing ones)
    // await Doctor.deleteMany({ specialty: { $in: specialtyDoctors.map(d => d.specialty) } });
    // await User.deleteMany({ email: { $in: specialtyDoctors.map(d => d.email) } });

    let addedCount = 0;

    for (const doctorData of specialtyDoctors) {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: doctorData.email });
        
        if (!user) {
          // Create new user
          const hashedPassword = await bcrypt.hash(doctorData.password, 10);
          user = new User({
            name: doctorData.name,
            email: doctorData.email,
            phoneNumber: doctorData.phoneNumber,
            password: hashedPassword,
            role: 'doctor'
          });
          await user.save();
          console.log(`✅ Created user: ${doctorData.name}`);
        }

        // Check if doctor profile already exists
        let doctor = await Doctor.findOne({ user: user._id });
        
        if (!doctor) {
          // Create new doctor profile
          doctor = new Doctor({
            user: user._id,
            specialty: doctorData.specialty,
            department: doctorData.department
          });
          await doctor.save();
          console.log(`✅ Created doctor profile: ${doctorData.name} - ${doctorData.specialty}`);
          addedCount++;
        } else {
          console.log(`ℹ️ Doctor profile already exists: ${doctorData.name} - ${doctorData.specialty}`);
        }

      } catch (error) {
        console.error(`❌ Error adding ${doctorData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully added ${addedCount} new specialty doctors!`);
    
    // Show current specialties in database
    const specialties = await Doctor.distinct('specialty');
    console.log('\n📋 Available specialties in database:');
    for (const specialty of specialties) {
      const count = await Doctor.countDocuments({ specialty });
      console.log(`  - ${specialty}: ${count} doctor(s)`);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addSpecialtyDoctors();
