import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './BookingPage.css';

const BookingPage = ({ doctorId, onBack }) => {
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchDoctorDetails = useCallback(async () => {
    try {
      setLoading(true);
      await axios.get(`http://localhost:3000/api/doctors/${doctorId}/details`);
      // For demo purposes, using mock data since the API might not be available
      setDoctor({
        _id: doctorId,
        name: 'Dr. Sarah Johnson',
        specialty: { name: 'Cardiology' },
        experience_years: 8,
        department: 'Cardiology Department',
        available_slots: [
          { day: 'Monday', start: '09:00', end: '10:00', isBooked: false },
          { day: 'Monday', start: '11:00', end: '12:00', isBooked: false },
          { day: 'Tuesday', start: '14:00', end: '15:00', isBooked: false },
          { day: 'Wednesday', start: '10:00', end: '11:00', isBooked: false }
        ]
      });
      setAvailableSlots([
        { day: 'Monday', start: '09:00', end: '10:00', isBooked: false },
        { day: 'Monday', start: '11:00', end: '12:00', isBooked: false },
        { day: 'Tuesday', start: '14:00', end: '15:00', isBooked: false },
        { day: 'Wednesday', start: '10:00', end: '11:00', isBooked: false }
      ]);
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      setError('Failed to load doctor details. Please try again.');
      // Mock data for demo
      setDoctor({
        _id: doctorId,
        name: 'Dr. Sarah Johnson',
        specialty: { name: 'Cardiology' },
        experience_years: 8,
        department: 'Cardiology Department',
        available_slots: [
          { day: 'Monday', start: '09:00', end: '10:00', isBooked: false },
          { day: 'Monday', start: '11:00', end: '12:00', isBooked: false },
          { day: 'Tuesday', start: '14:00', end: '15:00', isBooked: false },
          { day: 'Wednesday', start: '10:00', end: '11:00', isBooked: false }
        ]
      });
      setAvailableSlots([
        { day: 'Monday', start: '09:00', end: '10:00', isBooked: false },
        { day: 'Monday', start: '11:00', end: '12:00', isBooked: false },
        { day: 'Tuesday', start: '14:00', end: '15:00', isBooked: false },
        { day: 'Wednesday', start: '10:00', end: '11:00', isBooked: false }
      ]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId, fetchDoctorDetails]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      await axios.post('http://localhost:3000/api/appointments/book', {
        doctorId: doctor._id,
        day: selectedSlot.day,
        start: selectedSlot.start,
        end: selectedSlot.end,
        patientId: '507f1f77bcf86cd799439011' // Using test user ID from database
      });
      
      setSuccess(true);
      setTimeout(() => {
        onBack(); // Go back to doctor list
      }, 2000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (time) => {
    return time.replace(':', 'h');
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="booking-page">
        <div className="error-container">
          <h2>Doctor not found</h2>
          <button onClick={onBack} className="btn btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Doctors
        </button>
        <h1>Book Appointment</h1>
      </div>

      <div className="booking-content">
        <div className="doctor-details-card">
          <div className="doctor-avatar">
            👨‍⚕️
          </div>
          <div className="doctor-info">
            <h2>{doctor.name}</h2>
            <p className="specialty">{doctor.specialty?.name || 'Specialty'}</p>
            <p className="experience">{doctor.experience_years} years of experience</p>
            <p className="department">{doctor.department}</p>
          </div>
        </div>

        <div className="slots-section">
          <h3>Available Time Slots</h3>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              ✅ Appointment booked successfully! Redirecting...
            </div>
          )}

          {availableSlots.length === 0 ? (
            <div className="no-slots">
              <p>No available slots at the moment.</p>
              <p>Please check back later or contact the doctor directly.</p>
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`slot-card ${selectedSlot === slot ? 'selected' : ''} ${slot.isBooked ? 'booked' : ''}`}
                  onClick={() => !slot.isBooked && handleSlotSelect(slot)}
                >
                  <div className="slot-day">{slot.day}</div>
                  <div className="slot-time">
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                  </div>
                  {slot.isBooked && <div className="booked-label">Booked</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSlot && !selectedSlot.isBooked && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-card">
              <div className="summary-item">
                <span className="label">Doctor:</span>
                <span className="value">{doctor.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Date:</span>
                <span className="value">{selectedSlot.day}</span>
              </div>
              <div className="summary-item">
                <span className="label">Time:</span>
                <span className="value">{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</span>
              </div>
              <div className="summary-item">
                <span className="label">Duration:</span>
                <span className="value">1 hour</span>
              </div>
            </div>
            
            <button
              className="btn btn-primary book-btn"
              onClick={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage; 