const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Staff = require('../models/Staff');

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate('doctor', 'name specialty department')
      .populate('created_by', 'name')
      .sort({ day: 1, start_time: 1 });
    
    res.json({
      success: true,
      schedules: schedules.map(schedule => ({
        _id: schedule._id,
        doctor: schedule.doctor,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        created_by: schedule.created_by,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules'
    });
  }
});

// Get schedules for a specific day
router.get('/schedules/day/:day', async (req, res) => {
  try {
    const { day } = req.params;
    const schedules = await Schedule.getDaySchedule(day);
    
    res.json({
      success: true,
      day: day,
      schedules: schedules.map(schedule => ({
        _id: schedule._id,
        doctor: schedule.doctor,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status
      }))
    });
  } catch (error) {
    console.error('Error fetching day schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch day schedules'
    });
  }
});

// Get doctor's schedule
router.get('/schedules/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedules = await Schedule.getDoctorSchedule(doctorId);
    
    res.json({
      success: true,
      doctor_id: doctorId,
      schedules: schedules.map(schedule => ({
        _id: schedule._id,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status
      }))
    });
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor schedule'
    });
  }
});

// Get available time slots for a day
router.get('/schedules/available/:day', async (req, res) => {
  try {
    const { day } = req.params;
    const availableSlots = await Schedule.getAvailableSlots(day);
    
    res.json({
      success: true,
      day: day,
      available_slots: availableSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
});

// Create a new schedule
router.post('/schedules', async (req, res) => {
  try {
    const {
      doctor_id,
      day,
      start_time,
      end_time,
      created_by
    } = req.body;

    // Validate required fields
    if (!doctor_id || !day || !start_time || !end_time || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM format'
      });
    }

    // Validate time range (8 AM to 12 PM)
    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes < 480 || startMinutes > 720 || endMinutes < 480 || endMinutes > 720) {
      return res.status(400).json({
        success: false,
        error: 'Time must be between 08:00 and 12:00'
      });
    }

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time'
      });
    }

    // Check if doctor exists
    const doctor = await Staff.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Check for time conflicts
    const hasConflict = await Schedule.checkTimeConflict(doctor_id, day, start_time, end_time);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        error: 'Time slot conflicts with existing schedule'
      });
    }

    // Create the schedule
    const schedule = new Schedule({
      doctor: doctor_id,
      day,
      start_time,
      end_time,
      created_by
    });

    await schedule.save();
    await schedule.populate('doctor', 'name specialty department');
    await schedule.populate('created_by', 'name');

    res.status(201).json({
      success: true,
      schedule: {
        _id: schedule._id,
        doctor: schedule.doctor,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        created_by: schedule.created_by,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule'
    });
  }
});

// Update a schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day,
      start_time,
      end_time,
      status
    } = req.body;

    // Check if schedule exists
    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Validate time format if provided
    if (start_time || end_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (start_time && !timeRegex.test(start_time)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start time format. Use HH:MM format'
        });
      }
      if (end_time && !timeRegex.test(end_time)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end time format. Use HH:MM format'
        });
      }
    }

    // Validate time range if provided
    if (start_time && end_time) {
      const [startHour, startMin] = start_time.split(':').map(Number);
      const [endHour, endMin] = end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes < 480 || startMinutes > 720 || endMinutes < 480 || endMinutes > 720) {
        return res.status(400).json({
          success: false,
          error: 'Time must be between 08:00 and 12:00'
        });
      }

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          success: false,
          error: 'Start time must be before end time'
        });
      }

      // Check for time conflicts (excluding current schedule)
      const hasConflict = await Schedule.checkTimeConflict(
        existingSchedule.doctor,
        day || existingSchedule.day,
        start_time,
        end_time,
        id
      );
      if (hasConflict) {
        return res.status(400).json({
          success: false,
          error: 'Time slot conflicts with existing schedule'
        });
      }
    }

    // Update the schedule
    const updateData = {};
    if (day) updateData.day = day;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (status) updateData.status = status;

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('doctor', 'name specialty department');

    res.json({
      success: true,
      schedule: {
        _id: updatedSchedule._id,
        doctor: updatedSchedule.doctor,
        day: updatedSchedule.day,
        start_time: updatedSchedule.start_time,
        end_time: updatedSchedule.end_time,
        status: updatedSchedule.status,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule'
    });
  }
});

// Delete a schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    await Schedule.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule'
    });
  }
});

// Get schedule statistics
router.get('/schedules/stats', async (req, res) => {
  try {
    const totalSchedules = await Schedule.countDocuments();
    const activeSchedules = await Schedule.countDocuments({ status: 'active' });
    const cancelledSchedules = await Schedule.countDocuments({ status: 'cancelled' });
    
    // Get schedules by day
    const dayStats = await Schedule.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get schedules by doctor
    const doctorStats = await Schedule.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $lookup: { from: 'staff', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $project: { doctor_name: '$doctor.name', count: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalSchedules,
        active: activeSchedules,
        cancelled: cancelledSchedules,
        by_day: dayStats,
        by_doctor: doctorStats
      }
    });
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule statistics'
    });
  }
});

// Get weekly schedule overview
router.get('/schedules/weekly', async (req, res) => {
  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklySchedule = {};

    for (const day of days) {
      const daySchedules = await Schedule.getDaySchedule(day);
      weeklySchedule[day] = daySchedules.map(schedule => ({
        _id: schedule._id,
        doctor: schedule.doctor,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status
      }));
    }

    res.json({
      success: true,
      weekly_schedule: weeklySchedule
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly schedule'
    });
  }
});

module.exports = router;

