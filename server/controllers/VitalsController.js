import EMR from '../models/EMR.js';
import User from '../models/User.js';

// POST /api/vitals - Record new vitals for patient
export const recordVitals = async (req, res) => {
  try {
    const { bloodPressure, heartRate, temperature, weight, notes } = req.body;
    const patientId = req.user._id;

    // Validate required fields
    if (!bloodPressure || !heartRate || !temperature || !weight) {
      return res.status(400).json({ 
        message: 'Blood pressure, heart rate, temperature, and weight are required' 
      });
    }

    // Validate blood pressure ranges
    if (bloodPressure.systolic < 50 || bloodPressure.systolic > 300 ||
        bloodPressure.diastolic < 30 || bloodPressure.diastolic > 200) {
      return res.status(400).json({ 
        message: 'Blood pressure values are outside normal range' 
      });
    }

    // Validate other vitals
    if (heartRate < 30 || heartRate > 200) {
      return res.status(400).json({ message: 'Heart rate is outside normal range' });
    }
    if (temperature < 30 || temperature > 45) {
      return res.status(400).json({ message: 'Temperature is outside normal range' });
    }
    if (weight < 0 || weight > 500) {
      return res.status(400).json({ message: 'Weight is outside normal range' });
    }

    // Find or create EMR for patient
    let emr = await EMR.findOne({ patient: patientId });
    
    if (!emr) {
      emr = new EMR({ patient: patientId, vitals: [] });
    }

    // Add new vitals
    const newVitals = {
      date: new Date(),
      bloodPressure,
      heartRate,
      temperature,
      weight,
      notes: notes || ''
    };

    emr.vitals.push(newVitals);
    await emr.save();

    res.status(201).json({
      message: 'Vitals recorded successfully',
      vitals: newVitals
    });

  } catch (error) {
    console.error('Record vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/vitals/patient/:id - Get patient vitals
export const getPatientVitals = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own vitals or is a doctor
    if (req.user._id.toString() !== id && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const emr = await EMR.findOne({ patient: id });
    
    if (!emr || !emr.vitals) {
      return res.json({ vitals: [] });
    }

    // Sort vitals by date (newest first)
    const sortedVitals = emr.vitals.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ vitals: sortedVitals });

  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/vitals/patient/:id/latest - Get latest vitals
export const getLatestVitals = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own vitals or is a doctor
    if (req.user._id.toString() !== id && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const emr = await EMR.findOne({ patient: id });
    
    if (!emr || !emr.vitals || emr.vitals.length === 0) {
      return res.json({ vitals: null });
    }

    // Get most recent vitals
    const latestVitals = emr.vitals.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    res.json({ vitals: latestVitals });

  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
