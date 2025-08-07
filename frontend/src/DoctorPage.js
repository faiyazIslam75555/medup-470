import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorPage.css';

const DoctorPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorId, setDoctorId] = useState(null);

  // Get current day name
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    // For demo purposes, using a hardcoded doctor ID
    // In a real app, this would come from authentication
    const demoDoctorId = '507f1f77bcf86cd799439012'; // Using Dr. Sarah Johnson's ID from database
    setDoctorId(demoDoctorId);
    fetchAppointments(demoDoctorId);
  }, []);

  const fetchAppointments = async (doctorId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/doctors/${doctorId}/homepage`);
      setAppointments(response.data.patients || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
      // For demo purposes, create mock data
      setAppointments([
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          slot: { start: '09:00', end: '10:00' }
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          slot: { start: '11:00', end: '12:00' }
        },
        {
          id: '3',
          name: 'Michael Brown',
          email: 'michael.brown@email.com',
          slot: { start: '14:00', end: '15:00' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsByDate = async (doctorId, date) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/doctors/${doctorId}/appointments/${date}`);
      setAppointments(response.data.patients || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments by date:', err);
      setError('Failed to load appointments for selected date. Please try again.');
      // For demo purposes, create mock data for different dates
      const mockAppointments = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          slot: { start: '09:00', end: '10:00' }
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          slot: { start: '11:00', end: '12:00' }
        }
      ];
      setAppointments(mockAppointments);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (doctorId) {
      fetchAppointmentsByDate(doctorId, newDate);
    }
  };

  const formatTime = (time) => {
    return time.replace(':', 'h');
  };

  const getTimeSlotDisplay = (slot) => {
    return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
  };

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <h1>Doctor Dashboard</h1>
        <div className="header-info">
          <div className="date-selector">
            <label htmlFor="date-select">Select Date:</label>
            <input
              type="date"
              id="date-select"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>
          <div className="current-day">
            <span className="day-label">Today:</span>
            <span className="day-value">{getCurrentDay()}</span>
          </div>
        </div>
      </div>

      <div className="appointments-section">
        <div className="section-header">
          <h2>Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h2>
          <div className="appointment-count">
            <span className="count-number">{appointments.length}</span>
            <span className="count-label">Patients</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <div className="no-appointments-icon">📅</div>
            <h3>No Appointments</h3>
            <p>You have no scheduled appointments for the selected date.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((patient, index) => (
              <div key={patient.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="patient-number">#{index + 1}</div>
                  <div className="time-slot">
                    {getTimeSlotDisplay(patient.slot)}
                  </div>
                </div>
                
                <div className="patient-info">
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-email">{patient.email}</div>
                </div>

                <div className="appointment-actions">
                  <button className="btn btn-primary">View Details</button>
                  <button className="btn btn-secondary">Start Session</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{appointments.length}</div>
            <div className="stat-label">Total Patients</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">
              {appointments.length > 0 ? 
                `${appointments[0].slot.start} - ${appointments[appointments.length - 1].slot.end}` : 
                'No appointments'
              }
            </div>
            <div className="stat-label">Schedule Range</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{appointments.length * 60}</div>
            <div className="stat-label">Minutes Scheduled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPage; 