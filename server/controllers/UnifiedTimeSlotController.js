import UnifiedTimeSlot from '../models/UnifiedTimeSlot.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// Helper function to get day name
const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

// Helper function to get time slot display name
const getTimeSlotDisplay = (timeSlot) => {
  const timeMap = {
    '8-12': '8:00 AM - 12:00 PM',
    '12-4': '12:00 PM - 4:00 PM', 
    '4-8': '4:00 PM - 8:00 PM',
    '20-00': '8:00 PM - 12:00 AM'
  };
  return timeMap[timeSlot] || timeSlot;
};

/* =================== DOCTOR REQUESTS ====================== */

// POST /api/unified-time-slots/request - Doctor requests a time slot
export const requestTimeSlot = async (req, res) => {
  try {
    const { dayOfWeek, timeSlot, notes } = req.body;
    const userId = req.user._id;

    // Validate input
    if (dayOfWeek === undefined || !timeSlot) {
      return res.status(400).json({ message: 'Day of week and time slot are required' });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'Invalid day of week (0-6)' });
    }

    if (!['8-12', '12-4', '4-8', '20-00'].includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot' });
    }

    // Find the doctor profile
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Check if slot already exists
    let slot = await UnifiedTimeSlot.findOne({ dayOfWeek, timeSlot });
    
    if (!slot) {
      // Create new slot
      slot = new UnifiedTimeSlot({
        dayOfWeek,
        timeSlot,
        status: 'AVAILABLE',
        notes: notes || ''
      });
      await slot.save();
    }

    // Check if slot is already assigned to someone
    if (slot.status === 'ASSIGNED' && slot.doctor) {
      return res.status(400).json({ 
        message: `This time slot is already assigned to another doctor` 
      });
    }

    // Check if this doctor already has a pending request for this slot
    const existingRequest = await UnifiedTimeSlot.findOne({
      dayOfWeek,
      timeSlot,
      doctor: doctor._id,
      status: 'AVAILABLE'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: `You already have a request for ${getDayName(dayOfWeek)} ${getTimeSlotDisplay(timeSlot)}` 
      });
    }

    // Assign slot to doctor (pending admin approval)
    slot.doctor = doctor._id;
    slot.status = 'AVAILABLE'; // Still available until admin approves
    slot.notes = notes || '';
    await slot.save();

    res.json({
      message: `Time slot request submitted successfully. Pending admin approval.`,
      slot: {
        _id: slot._id,
        dayOfWeek: slot.dayOfWeek,
        dayName: getDayName(slot.dayOfWeek),
        timeSlot: slot.timeSlot,
        timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
        status: slot.status,
        notes: slot.notes
      }
    });

  } catch (error) {
    console.error('Request time slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/unified-time-slots/doctor/my-requests - Get doctor's time slot requests
export const getMyTimeSlotRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const slots = await UnifiedTimeSlot.find({ doctor: doctor._id })
      .populate('approvedBy', 'name email')
      .sort({ dayOfWeek: 1, timeSlot: 1 });

    const formattedSlots = slots.map(slot => ({
      _id: slot._id,
      dayOfWeek: slot.dayOfWeek,
      dayName: getDayName(slot.dayOfWeek),
      timeSlot: slot.timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
      status: slot.status,
      notes: slot.notes,
      assignedAt: slot.assignedAt,
      approvedBy: slot.approvedBy,
      bookedDatesCount: slot.bookedDates.length,
      nextAvailableDate: getNextAvailableDate(slot)
    }));

    res.json({
      slots: formattedSlots,
      count: formattedSlots.length
    });

  } catch (error) {
    console.error('Get my time slot requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* =================== ADMIN APPROVAL ====================== */

// GET /api/unified-time-slots/admin/all - Get all time slots for admin
export const getAllTimeSlotsForAdmin = async (req, res) => {
  try {
    const slots = await UnifiedTimeSlot.getAllSlotsForAdmin();

    const formattedSlots = slots.map(slot => ({
      _id: slot._id,
      dayOfWeek: slot.dayOfWeek,
      dayName: getDayName(slot.dayOfWeek),
      timeSlot: slot.timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
      status: slot.status,
      doctor: slot.doctor ? {
        id: slot.doctor._id,
        name: slot.doctor.user.name,
        email: slot.doctor.user.email,
        specialty: slot.doctor.specialty
      } : null,
      notes: slot.notes,
      assignedAt: slot.assignedAt,
      approvedBy: slot.approvedBy,
      bookedDatesCount: slot.bookedDates.length,
      recentBookings: slot.bookedDates.slice(-3).map(booking => ({
        date: booking.date,
        status: booking.status,
        reason: booking.reason
      }))
    }));

    res.json({
      slots: formattedSlots,
      count: formattedSlots.length
    });

  } catch (error) {
    console.error('Get all time slots for admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/unified-time-slots/admin/:id/approve - Admin approves time slot assignment
export const approveTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const slot = await UnifiedTimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (!slot.doctor) {
      return res.status(400).json({ message: 'No doctor assigned to this slot' });
    }

    if (slot.status === 'ASSIGNED') {
      return res.status(400).json({ message: 'This slot is already approved' });
    }

    // Approve the slot
    slot.status = 'ASSIGNED';
    slot.assignedAt = new Date();
    slot.approvedBy = adminId;
    await slot.save();

    res.json({
      message: 'Time slot approved successfully',
      slot: {
        _id: slot._id,
        dayOfWeek: slot.dayOfWeek,
        dayName: getDayName(slot.dayOfWeek),
        timeSlot: slot.timeSlot,
        timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
        status: slot.status,
        assignedAt: slot.assignedAt,
        approvedBy: slot.approvedBy
      }
    });

  } catch (error) {
    console.error('Approve time slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/unified-time-slots/admin/:id/reject - Admin rejects time slot assignment
export const rejectTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const slot = await UnifiedTimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (!slot.doctor) {
      return res.status(400).json({ message: 'No doctor assigned to this slot' });
    }

    // Remove doctor assignment and reset to available
    slot.doctor = null;
    slot.status = 'AVAILABLE';
    slot.notes = reason || 'Rejected by admin';
    slot.assignedAt = null;
    slot.approvedBy = null;
    await slot.save();

    res.json({
      message: 'Time slot rejected successfully',
      slot: {
        _id: slot._id,
        dayOfWeek: slot.dayOfWeek,
        dayName: getDayName(slot.dayOfWeek),
        timeSlot: slot.timeSlot,
        timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
        status: slot.status,
        notes: slot.notes
      }
    });

  } catch (error) {
    console.error('Reject time slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* =================== PATIENT BOOKING ====================== */

// GET /api/unified-time-slots/patient/available - Get available slots for patients
export const getAvailableSlotsForPatients = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const slots = await UnifiedTimeSlot.getAvailableSlotsForPatients(startDate, endDate);

    const availableSlots = [];

    for (const slot of slots) {
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const availableDates = slot.getAvailableDates(start, end);
      
      if (availableDates.length > 0) {
        availableSlots.push({
          slotId: slot._id,
          doctor: {
            id: slot.doctor._id,
            name: slot.doctor.user.name,
            email: slot.doctor.user.email,
            specialty: slot.doctor.specialty
          },
          dayOfWeek: slot.dayOfWeek,
          dayName: getDayName(slot.dayOfWeek),
          timeSlot: slot.timeSlot,
          timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
          availableDates: availableDates.map(date => ({
            date: date.toISOString().split('T')[0],
            dayName: getDayName(date.getDay())
          })),
          availableCount: availableDates.length
        });
      }
    }

    res.json({
      availableSlots,
      count: availableSlots.length
    });

  } catch (error) {
    console.error('Get available slots for patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/unified-time-slots/patient/book - Patient books a specific date
export const bookTimeSlot = async (req, res) => {
  try {
    const { slotId, date, reason } = req.body;
    const userId = req.user._id;

    if (!slotId || !date || !reason) {
      return res.status(400).json({ message: 'Slot ID, date, and reason are required' });
    }

    const slot = await UnifiedTimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (slot.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'This time slot is not available for booking' });
    }

    const appointmentDate = new Date(date);
    
    // Check if date is available
    if (!slot.isDateAvailable(appointmentDate)) {
      return res.status(400).json({ message: 'This date is not available for booking' });
    }

    // Check if appointment date matches the slot's day of week
    if (appointmentDate.getDay() !== slot.dayOfWeek) {
      return res.status(400).json({ 
        message: 'Appointment date does not match the slot day of week' 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      user: userId,
      doctor: slot.doctor,
      date: appointmentDate,
      dayOfWeek: slot.dayOfWeek,
      timeSlot: slot.timeSlot,
      reason: reason.trim(),
      status: 'booked'
    });

    await appointment.save();

    // Book the date in the slot
    await slot.bookDate(appointmentDate, userId, appointment._id, reason);

    // Populate appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error('Book time slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* =================== HELPER FUNCTIONS ====================== */

// Helper function to get next available date for a slot
const getNextAvailableDate = (slot) => {
  if (slot.status !== 'ASSIGNED') {
    return null;
  }
  
  const today = new Date();
  const currentDate = new Date(today);
  
  // Look for the next 30 days
  for (let i = 0; i < 30; i++) {
    if (currentDate.getDay() === slot.dayOfWeek && slot.isDateAvailable(currentDate)) {
      return currentDate.toISOString().split('T')[0];
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null;
};

// GET /api/unified-time-slots/admin/day/:dayOfWeek - Get slots for a specific day
export const getSlotsForDay = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const dayNum = parseInt(dayOfWeek);

    if (dayNum < 0 || dayNum > 6) {
      return res.status(400).json({ message: 'Invalid day of week (0-6)' });
    }

    const slots = await UnifiedTimeSlot.find({ dayOfWeek: dayNum })
      .populate('doctor', 'specialty')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('approvedBy', 'name email')
      .sort({ timeSlot: 1 });

    const formattedSlots = slots.map(slot => ({
      _id: slot._id,
      dayOfWeek: slot.dayOfWeek,
      dayName: getDayName(slot.dayOfWeek),
      timeSlot: slot.timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot),
      status: slot.status,
      doctor: slot.doctor ? {
        id: slot.doctor._id,
        name: slot.doctor.user.name,
        email: slot.doctor.user.email,
        specialty: slot.doctor.specialty
      } : null,
      notes: slot.notes,
      assignedAt: slot.assignedAt,
      approvedBy: slot.approvedBy,
      bookedDatesCount: slot.bookedDates.length,
      recentBookings: slot.bookedDates.slice(-3).map(booking => ({
        date: booking.date,
        status: booking.status,
        reason: booking.reason
      }))
    }));

    res.json({
      dayOfWeek: dayNum,
      dayName: getDayName(dayNum),
      slots: formattedSlots,
      count: formattedSlots.length
    });

  } catch (error) {
    console.error('Get slots for day error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};










