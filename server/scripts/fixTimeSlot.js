import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TimeSlot from '../models/TimeSlot.js';
import Doctor from '../models/Doctor.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'HospitalDB',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const fixTimeSlot = async () => {
  try {
    console.log('🔧 Fixing time slot assignment...');
    
    // Find the Monday 8-12 time slot
    const timeSlot = await TimeSlot.findOne({ 
      dayOfWeek: 1, 
      timeSlot: '8-12' 
    });
    
    if (!timeSlot) {
      console.log('❌ Time slot not found');
      return;
    }

    console.log('📋 Current time slot status:');
    console.log(`   Status: ${timeSlot.status}`);
    console.log(`   Assigned To: ${timeSlot.assignedTo}`);
    console.log(`   Notes: ${timeSlot.notes}`);

    // Find the doctor by user ID (the current assignedTo value)
    const doctor = await Doctor.findOne({ user: timeSlot.assignedTo });
    
    if (!doctor) {
      console.log('❌ Doctor not found for user ID:', timeSlot.assignedTo);
      return;
    }

    console.log('✅ Found doctor:', doctor._id);

    // Fix the assignedTo field to use Doctor ID instead of User ID
    timeSlot.assignedTo = doctor._id;
    await timeSlot.save();

    console.log('✅ Fixed time slot:');
    console.log(`   New Assigned To: ${timeSlot.assignedTo}`);
    console.log(`   Status: ${timeSlot.status}`);
    
  } catch (error) {
    console.error('❌ Error fixing time slot:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixTimeSlot();
    process.exit(0);
  } catch (error) {
    console.error('❌ Main error:', error);
    process.exit(1);
  }
};

main();


