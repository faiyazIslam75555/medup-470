const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Specialty = require('../models/Specialty');

// Get all specialties
router.get('/specialties', async (req, res) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
    res.json({
      success: true,
      specialties: specialties.map(spec => ({
        _id: spec._id,
        name: spec.name
      }))
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch specialties'
    });
  }
});

// Get all staff members
router.get('/staff', async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate('specialty', 'name')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      staff: staff.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        specialty: member.specialty ? member.specialty.name : null,
        experience_years: member.experience_years,
        department: member.department,
        qualification: member.qualification,
        license_number: member.license_number,
        hire_date: member.hire_date,
        salary: member.salary,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch staff data' 
    });
  }
});

// Get a specific staff member
router.get('/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('specialty', 'name');
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Staff member not found' 
      });
    }
    
    res.json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        specialty: staff.specialty ? staff.specialty.name : null,
        experience_years: staff.experience_years,
        department: staff.department,
        qualification: staff.qualification,
        license_number: staff.license_number,
        hire_date: staff.hire_date,
        salary: staff.salary,
        status: staff.status,
        created_at: staff.created_at,
        updated_at: staff.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch staff member' 
    });
  }
});

// Add new staff member
router.post('/staff', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      specialty,
      experience_years,
      department,
      qualification,
      license_number,
      hire_date,
      salary,
      status
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !role || !department || !qualification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // For doctors, validate specialty and experience
    if (role === 'doctor') {
      if (!specialty) {
        return res.status(400).json({
          success: false,
          error: 'Specialty is required for doctors'
        });
      }
      
      // Find specialty by name
      const specialtyDoc = await Specialty.findOne({ name: specialty });
      if (!specialtyDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid specialty'
        });
      }
    }

    // Create staff member
    const staffData = {
      name,
      email,
      phone,
      role,
      department,
      qualification,
      hire_date: hire_date || new Date(),
      salary: salary || 0,
      status: status || 'active'
    };

    // Add role-specific fields
    if (role === 'doctor') {
      const specialtyDoc = await Specialty.findOne({ name: specialty });
      staffData.specialty = specialtyDoc._id;
      staffData.experience_years = experience_years || 0;
      staffData.license_number = license_number;
    } else if (role === 'nurse') {
      staffData.license_number = license_number;
    }

    const newStaff = new Staff(staffData);
    await newStaff.save();

    // Populate specialty for response
    await newStaff.populate('specialty', 'name');

    res.status(201).json({
      success: true,
      staff: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        specialty: newStaff.specialty ? newStaff.specialty.name : null,
        experience_years: newStaff.experience_years,
        department: newStaff.department,
        qualification: newStaff.qualification,
        license_number: newStaff.license_number,
        hire_date: newStaff.hire_date,
        salary: newStaff.salary,
        status: newStaff.status,
        created_at: newStaff.created_at,
        updated_at: newStaff.updated_at
      }
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add staff member'
    });
  }
});

// Update staff member
router.put('/staff/:id', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      specialty,
      experience_years,
      department,
      qualification,
      license_number,
      hire_date,
      salary,
      status
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !role || !department || !qualification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if staff member exists
    const existingStaff = await Staff.findById(req.params.id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Check if email already exists for another staff member
    const emailExists = await Staff.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // For doctors, validate specialty
    let specialtyId = null;
    if (role === 'doctor') {
      if (!specialty) {
        return res.status(400).json({
          success: false,
          error: 'Specialty is required for doctors'
        });
      }
      
      const specialtyDoc = await Specialty.findOne({ name: specialty });
      if (!specialtyDoc) {
        return res.status(400).json({
          success: false,
          error: 'Invalid specialty'
        });
      }
      specialtyId = specialtyDoc._id;
    }

    // Update staff member
    const updateData = {
      name,
      email,
      phone,
      role,
      department,
      qualification,
      hire_date: hire_date || existingStaff.hire_date,
      salary: salary || existingStaff.salary,
      status: status || existingStaff.status
    };

    // Add role-specific fields
    if (role === 'doctor') {
      updateData.specialty = specialtyId;
      updateData.experience_years = experience_years || 0;
      updateData.license_number = license_number;
    } else if (role === 'nurse') {
      updateData.license_number = license_number;
    } else {
      // Remove doctor-specific fields for non-doctors
      updateData.specialty = undefined;
      updateData.experience_years = undefined;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('specialty', 'name');

    res.json({
      success: true,
      staff: {
        _id: updatedStaff._id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        phone: updatedStaff.phone,
        role: updatedStaff.role,
        specialty: updatedStaff.specialty ? updatedStaff.specialty.name : null,
        experience_years: updatedStaff.experience_years,
        department: updatedStaff.department,
        qualification: updatedStaff.qualification,
        license_number: updatedStaff.license_number,
        hire_date: updatedStaff.hire_date,
        salary: updatedStaff.salary,
        status: updatedStaff.status,
        created_at: updatedStaff.created_at,
        updated_at: updatedStaff.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member'
    });
  }
});

// Delete staff member
router.delete('/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    await Staff.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
});

// Get staff by role
router.get('/staff/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const staff = await Staff.find({ role })
      .populate('specialty', 'name')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      staff: staff.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        specialty: member.specialty ? member.specialty.name : null,
        experience_years: member.experience_years,
        department: member.department,
        qualification: member.qualification,
        license_number: member.license_number,
        hire_date: member.hire_date,
        salary: member.salary,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching staff by role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff by role'
    });
  }
});

// Get staff statistics
router.get('/staff/stats', async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ status: 'active' });
    const doctors = await Staff.countDocuments({ role: 'doctor' });
    const nurses = await Staff.countDocuments({ role: 'nurse' });
    const receptionists = await Staff.countDocuments({ role: 'receptionist' });
    const admins = await Staff.countDocuments({ role: 'admin' });
    
    res.json({
      success: true,
      stats: {
        total: totalStaff,
        active: activeStaff,
        byRole: {
          doctors,
          nurses,
          receptionists,
          admins
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff statistics'
    });
  }
});

module.exports = router;
