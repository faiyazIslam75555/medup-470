import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../utils/api';

const AppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '', // legacy (kept for UI compatibility)
    dayOfWeek: '', // legacy (kept for UI compatibility)
    timeSlot: '',
    reason: '',
    urgency: 'normal',
    bookedDate: '', // concrete date required by backend
    slotId: '' // store the selected slot ID
  });
  const [selectedWeek, setSelectedWeek] = useState('thisWeek');
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const doctor = location.state?.doctor;
    const doctorId = doctor?.id || doctor?._id;
    if (doctor && doctorId) {
      setSelectedDoctor(doctor);
      setFormData(prev => ({ ...prev, doctorId: doctorId }));
      fetchAvailableSlots(doctorId);
    } else {
      console.error('No doctor information found in navigation state');
      navigate('/search-doctors');
    }
  }, [location, navigate]);

  // Handle week selection changes
  useEffect(() => {
    if (availableSlots.length > 0) {
      const filtered = filterSlotsByWeek(availableSlots, selectedWeek);
      setFilteredSlots(filtered);
    }
  }, [selectedWeek, availableSlots]);

  const fetchAvailableSlots = async (doctorId) => {
    try {
      setLoading(true);
      
      // Calculate date range for next 4 weeks
      const today = new Date();
      const fourWeeksFromNow = new Date(today);
      fourWeeksFromNow.setDate(today.getDate() + 28);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = fourWeeksFromNow.toISOString().split('T')[0];
      
      console.log('📅 Fetching slots for date range:', { startDate, endDate });
      
      // Use the unified time slot API to get available slots with date range
      const response = await fetch(`${API_BASE_URL}/api/unified-time-slots/patient/available?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Backend response:', data);
        
        // Filter slots by the selected doctor
        const doctorSlots = data.availableSlots.filter(slot => 
          slot.doctor.id === doctorId || slot.doctor._id === doctorId
        );
        
        console.log('🔍 Processing doctor slots:', doctorSlots);
        
        // Process slots using backend-generated dates
        const processedSlots = doctorSlots.map(slot => {
          console.log('📅 Processing slot from backend:', {
            slotId: slot.slotId,
            dayOfWeek: slot.dayOfWeek,
            timeSlot: slot.timeSlot,
            backendAvailableDates: slot.availableDates
          });
          
          // Use the backend-generated available dates (they're already correct)
          const availableDates = slot.availableDates.map(availDate => {
            const dateObj = new Date(availDate.date);
            return {
              date: availDate.date,
              dayOfWeek: dateObj.getDay(),
              dayName: availDate.dayName
            };
          });
          
          console.log('✅ Processed available dates from backend:', availableDates);
          
          return {
            _id: slot.slotId,
            dayOfWeek: slot.dayOfWeek,
            timeSlot: slot.timeSlot,
            availableDates: availableDates.slice(0, 4) // Show next 4 available dates
          };
        }).filter(slot => slot.availableDates.length > 0);
        
        console.log('🎯 Final processed slots:', processedSlots);
        
        setAvailableSlots(processedSlots);
        // Filter slots for the selected week
        const filtered = filterSlotsByWeek(processedSlots, selectedWeek);
        setFilteredSlots(filtered);
      } else {
        console.error('Failed to fetch available slots');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  // Get week date ranges for weekly recurring system
  const getWeekRange = (weekType) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek; // Sunday = 0
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    switch (weekType) {
      case 'thisWeek':
        return { start: startOfWeek, end: endOfWeek, label: 'This Week' };
      case 'nextWeek':
        const nextWeekStart = new Date(startOfWeek);
        nextWeekStart.setDate(startOfWeek.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);
        return { start: nextWeekStart, end: nextWeekEnd, label: 'Next Week' };
      case 'weekAfter':
        const weekAfterStart = new Date(startOfWeek);
        weekAfterStart.setDate(startOfWeek.getDate() + 14);
        const weekAfterEnd = new Date(weekAfterStart);
        weekAfterEnd.setDate(weekAfterStart.getDate() + 6);
        weekAfterEnd.setHours(23, 59, 59, 999);
        return { start: weekAfterStart, end: weekAfterEnd, label: 'Week After Next' };
      case 'week4':
        const week4Start = new Date(startOfWeek);
        week4Start.setDate(startOfWeek.getDate() + 21);
        const week4End = new Date(week4Start);
        week4End.setDate(week4Start.getDate() + 6);
        week4End.setHours(23, 59, 59, 999);
        return { start: week4Start, end: week4End, label: '4th Week' };
      default:
        return { start: startOfWeek, end: endOfWeek, label: 'This Week' };
    }
  };

  // Filter slots by selected week
  const filterSlotsByWeek = (slots, weekType) => {
    const weekRange = getWeekRange(weekType);
    console.log('📅 Filtering by week:', {
      weekType,
      weekRange: {
        start: weekRange.start.toISOString(),
        end: weekRange.end.toISOString()
      },
      totalSlots: slots.length
    });
    
    const filtered = slots.map(slot => {
      const filteredDates = slot.availableDates.filter(date => {
        const dateObj = new Date(date.date);
        const isInRange = dateObj >= weekRange.start && dateObj <= weekRange.end;
        console.log('📅 Date filter:', {
          date: date.date,
          dateObj: dateObj.toISOString(),
          isInRange,
          slotId: slot._id
        });
        return isInRange;
      });
      
      return {
        ...slot,
        availableDates: filteredDates
      };
    }).filter(slot => slot.availableDates.length > 0);
    
    console.log('🎯 Filtered slots result:', filtered);
    return filtered;
  };

  // Helper to compute next occurrence of a weekday (legacy helper kept)
  const getNextOccurrence = (dayOfWeek) => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = dayOfWeek - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Slot selection using backend-generated dates (guaranteed to match)
  const handleTimeSlotSelect = (dayOfWeek, timeSlot, selectedDate, slotId) => {
    console.log('🎯 Time slot selected:', { 
      dayOfWeek,
      timeSlot, 
      selectedDate,
      slotId
    });
    
    setFormData(prev => ({
      ...prev,
      dayOfWeek: dayOfWeek, // Use the slot's day of the week
      timeSlot,
      date: selectedDate, // legacy UI value
      bookedDate: selectedDate, // The specific date to book
      slotId: slotId // Use the slot ID (this is the recurring slot)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form change:', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    console.log('Form data before submit:', formData);

    // Simple validation
    if (!formData.slotId) {
      alert('Please select a time slot.');
      return;
    }

    if (!formData.reason || formData.reason.trim() === '') {
      alert('Please provide a reason for your appointment.');
      return;
    }
    
    setIsSubmitting(true);

    // Use the unified time slot booking API
    const requestPayload = {
      slotId: formData.slotId,
      date: formData.bookedDate,
      reason: formData.reason.trim()
    };

          console.log('🚀 API Request:', requestPayload);
      
      // Show booking in progress message
      setSuccessMessage('⏳ Booking your time slot... Please wait...');
      
      try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/unified-time-slots/patient/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });
      
              if (response.ok) {
          const successData = await response.json();
          const selectedDate = new Date(formData.bookedDate);
          const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
          setSuccessMessage(`🎉 Time slot booked successfully! 

📅 Appointment Details:
• Date: ${selectedDate.toLocaleDateString()} (${dayName})
• Time: ${formData.timeSlot}
• Doctor: Dr. ${selectedDoctor?.name || 'Unknown'}

✅ Your appointment is confirmed! Redirecting to dashboard...`);
          setTimeout(() => {
            navigate('/patient-dashboard');
          }, 3000);
        } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ 
          minHeight: '80vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ fontSize: '18px' }}>Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
        <button
          onClick={handleBack}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '30px' }}>
              Book Appointment
            </h1>

                     {successMessage && (
             <div style={{
               backgroundColor: '#d1ecf1',
              color: '#0c5460',
              padding: '20px',
               borderRadius: '8px',
               marginBottom: '20px',
              textAlign: 'center',
              border: '2px solid #bee5eb',
              fontSize: '16px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
             }}>
              {successMessage}
             </div>
           )}

        {/* Doctor Information - ORIGINAL STYLE MAINTAINED */}
        {selectedDoctor && (
          <div style={{
            backgroundColor: '#f8f9fa',
                      padding: '20px',
            borderRadius: '10px',
            marginBottom: '30px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>Doctor Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <p style={{ margin: '0', color: '#666' }}>
                <strong>Name:</strong> Dr. {selectedDoctor.name || 'Unknown'}
              </p>
              <p style={{ margin: '0', color: '#666' }}>
                <strong>Specialty:</strong> {selectedDoctor.specialty || 'N/A'}
              </p>
              <p style={{ margin: '0', color: '#666' }}>
                <strong>Email:</strong> {selectedDoctor.email || 'N/A'}
                      </p>
                    </div>
          </div>
        )}

        {/* Week Selector */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Select Week</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ color: '#555', fontWeight: 'bold' }}>Week:</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
                              style={{
                                padding: '8px 12px',
                border: '1px solid #ddd',
                                borderRadius: '5px',
                fontSize: '16px',
                backgroundColor: 'white',
                minWidth: '200px'
              }}
            >
              <option value="thisWeek">This Week</option>
              <option value="nextWeek">Next Week</option>
              <option value="weekAfter">Week After Next</option>
              <option value="week4">4th Week</option>
            </select>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {getWeekRange(selectedWeek).label}
            </div>
          </div>
        </div>

        {/* Available Time Slots - ORIGINAL STYLE MAINTAINED */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #dee2e6',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>Available Time Slots</h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Each time slot is available every week on the same day. Select a specific date to book.
          </p>
          
          {filteredSlots.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px' 
            }}>
              No available appointments found for {getWeekRange(selectedWeek).label.toLowerCase()}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {filteredSlots.map((slot, index) => (
                slot.availableDates.map((availableDate) => (
                  <div
                    key={`${slot._id}-${availableDate.date}`}
                    onClick={() => handleTimeSlotSelect(slot.dayOfWeek, slot.timeSlot, availableDate.date, slot._id)}
                    style={{
                      padding: '15px',
                      border: formData.timeSlot === slot.timeSlot && formData.bookedDate === availableDate.date
                        ? '2px solid #007bff'
                        : '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.timeSlot === slot.timeSlot && formData.bookedDate === availableDate.date
                        ? '#e3f2fd'
                        : 'white',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                      {availableDate.dayName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
                      {new Date(availableDate.date).toLocaleDateString()}
                    </div>
                    <div style={{ color: '#007bff', fontWeight: 'bold', fontSize: '14px' }}>
                      {slot.timeSlot}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '3px' }}>
                      Weekly recurring
                    </div>
                  </div>
                ))
              ))}
              </div>
            )}

          {checkingAvailability && (
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
              Checking availability...
          </div>
          )}

          {/* Selected Slot Display */}
          {formData.timeSlot && formData.bookedDate && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                Selected Time Slot:
              </h4>
              <p style={{ margin: '5px 0', color: '#333' }}>
                <strong>Day:</strong> {getDayName(formData.dayOfWeek)}
              </p>
              <p style={{ margin: '5px 0', color: '#333' }}>
                <strong>Time:</strong> {formData.timeSlot}
              </p>
              <p style={{ margin: '5px 0', color: '#333' }}>
                <strong>Date:</strong> {new Date(formData.bookedDate).toLocaleDateString()}
              </p>
                  </div>
          )}
                </div>

        {/* Appointment Form - KEPT YOUR ORIGINAL STYLE */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            Appointment Details
          </h2>

                <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
              Reason for Visit *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                padding: '12px',
                      border: '1px solid #ddd',
                borderRadius: '4px',
                      fontSize: '16px',
                minHeight: '100px',
                      resize: 'vertical'
                    }}
              placeholder="Please describe the reason for your appointment..."
                  />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              Current value: "{formData.reason}"
            </div>
                </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                    Urgency Level:
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                padding: '12px',
                      border: '1px solid #ddd',
                borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
              padding: '12px',
                    backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
              borderRadius: '4px',
                    fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Booking Appointment...' : 'Book Appointment'}
                </button>
              </form>
            </div>
      <Footer />
    </>
  );
};

export default AppointmentPage;
