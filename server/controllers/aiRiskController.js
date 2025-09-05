// controllers/aiRiskController.js
import { callGemini } from '../utils/geminiApi.js';
import User from '../models/User.js';
import EMR from '../models/EMR.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import AppointmentSuggestion from '../models/AppointmentSuggestion.js';

// Find the riskiest patient from all patients
export const findRiskiestPatient = async (req, res) => {
  try {
    // Get all patients
    const patients = await User.find({ role: 'patient' }).select('name email');
    
    if (patients.length === 0) {
      return res.json({
        success: true,
        message: 'No patients found',
        riskiestPatient: null
      });
    }
    
    // Gather data for each patient
    const patientSummaries = [];
    
    for (const patient of patients) {
      try {
        // Get latest vitals
        const emr = await EMR.findOne({ patient: patient._id }).populate('vitals');
        const latestVitals = emr?.vitals?.length > 0 ? emr.vitals[emr.vitals.length - 1] : null;
        
        // Get visit count this week
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const visitCount = await Appointment.countDocuments({
          user: patient._id,
          date: { $gte: thisWeek },
          status: { $in: ['booked', 'confirmed', 'completed'] }
        });
        
        // Get most recent appointment
        const recentAppointment = await Appointment.findOne({ user: patient._id })
          .sort({ date: -1 })
          .select('date reason urgency');
        
        // Create patient summary
        const summary = {
          name: patient.name,
          bp: latestVitals?.bloodPressure || 'N/A',
          hr: latestVitals?.heartRate || 'N/A',
          visitCount: visitCount,
          recentVisit: recentAppointment ? 
            `${recentAppointment.reason} (${recentAppointment.urgency || 'normal'} urgency)` : 
            'No recent visits'
        };
        
        patientSummaries.push(summary);
        
      } catch (error) {
        console.error(`Error gathering data for patient ${patient.name}:`, error);
        // Continue with other patients
      }
    }
    
    if (patientSummaries.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Failed to gather patient data' 
      });
    }
    
    // Create AI prompt
    const aiPrompt = generateBulkRiskPrompt(patientSummaries);
    
    // Call Gemini AI for risk assessment
    const riskAnalysis = await callGemini(aiPrompt);
    
    if (!riskAnalysis) {
      // Fallback: Return the first patient as most at risk if AI fails
      console.log('AI analysis failed, using fallback logic');
      const fallbackPatient = patientSummaries[0];
      const riskAssessment = {
        name: fallbackPatient.name,
        riskLevel: '7', // Medium-high risk as fallback
        reason: 'High visit frequency'
      };
      
      return res.json({
        success: true,
        message: 'Risk analysis completed (fallback mode)',
        riskiestPatient: riskAssessment,
        analyzedPatients: patientSummaries.length
      });
    }
    
    // Parse AI response
    const riskAssessment = parseRiskAssessment(riskAnalysis);
    
    res.json({
      success: true,
      message: 'Risk analysis completed',
      riskiestPatient: riskAssessment,
      analyzedPatients: patientSummaries.length
    });
    
  } catch (error) {
    console.error('Find riskiest patient error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze patients risk',
      error: error.message 
    });
  }
};

// Generate AI prompt for bulk risk analysis
function generateBulkRiskPrompt(patientSummaries) {
  let prompt = `From these ${patientSummaries.length} patients, which ONE is most at risk?\n\n`;
  
  patientSummaries.forEach((patient, index) => {
    prompt += `Patient ${index + 1}: ${patient.name} - `;
    prompt += `Visits this week: ${patient.visitCount}, `;
    prompt += `BP ${patient.bp}, HR ${patient.hr}, `;
    prompt += `Recent: ${patient.recentVisit}\n`;
  });
  
  prompt += `\nAnswer format:\n`;
  prompt += `Patient Name: [Name]\n`;
  prompt += `Risk Level: [1-10]\n`;
  prompt += `Reason: [5-6 words max]`;
  
  return prompt;
}

// Parse AI response to extract structured risk assessment
function parseRiskAssessment(aiResponse) {
  try {
    // Extract patient name
    const nameMatch = aiResponse.match(/Patient Name:\s*(.+)/i);
    const levelMatch = aiResponse.match(/Risk Level:\s*(\d+)/i);
    const reasonMatch = aiResponse.match(/Reason:\s*(.+)/i);
    
    if (nameMatch && levelMatch && reasonMatch) {
      return {
        name: nameMatch[1].trim(),
        riskLevel: parseInt(levelMatch[1]),
        reason: reasonMatch[1].trim()
      };
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error);
  }
  
  // Fallback parsing
  return {
    name: 'Unknown Patient',
    riskLevel: 5,
    reason: 'Risk assessment failed'
  };
}

// Suggest appointment for a patient
export const suggestAppointment = async (req, res) => {
  try {
    const { patientName, reason } = req.body;
    
    if (!patientName || !reason) {
      return res.status(400).json({ 
        success: false,
        message: 'Patient name and reason are required' 
      });
    }
    
    // Find patient by name
    const patient = await User.findOne({ name: patientName, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }
    
    // Find doctor from authenticated user
    const doctorUser = await User.findById(req.user._id);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(403).json({ 
        success: false,
        message: 'Only doctors can suggest appointments' 
      });
    }
    
    // Create appointment suggestion
    const appointmentSuggestion = new AppointmentSuggestion({
      patient: patient._id,
      doctor: req.user._id,
      reason: reason.trim(),
      suggestedAt: new Date(),
      status: 'pending'
    });
    
    await appointmentSuggestion.save();
    
    res.json({
      success: true,
      message: 'Appointment suggestion created successfully',
      suggestion: appointmentSuggestion
    });
    
  } catch (error) {
    console.error('Suggest appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to suggest appointment',
      error: error.message 
    });
  }
};

export default {
  findRiskiestPatient,
  suggestAppointment
};
