import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UnifiedTimeSlot from '../models/UnifiedTimeSlot.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize all possible time slots
const initializeTimeSlots = async () => {
  try {
    console.log('Initializing unified time slots...');
    
    const days = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
    const timeSlots = ['8-12', '12-4', '4-8', '20-00'];
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const dayOfWeek of days) {
      for (const timeSlot of timeSlots) {
        // Check if slot already exists
        const existingSlot = await UnifiedTimeSlot.findOne({ dayOfWeek, timeSlot });
        
        if (!existingSlot) {
          const newSlot = new UnifiedTimeSlot({
            dayOfWeek,
            timeSlot,
            status: 'AVAILABLE'
          });
          
          await newSlot.save();
          createdCount++;
          console.log(`Created slot: ${getDayName(dayOfWeek)} ${timeSlot}`);
        } else {
          existingCount++;
          console.log(`Slot already exists: ${getDayName(dayOfWeek)} ${timeSlot}`);
        }
      }
    }
    
    console.log(`\nInitialization complete!`);
    console.log(`Created: ${createdCount} slots`);
    console.log(`Already existed: ${existingCount} slots`);
    console.log(`Total slots: ${createdCount + existingCount}`);
    
  } catch (error) {
    console.error('Error initializing time slots:', error);
  }
};

// Helper function to get day name
const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

// Main execution
const main = async () => {
  await connectDB();
  await initializeTimeSlots();
  process.exit(0);
};

main();










