import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

const AdminTimeSlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // Current day
  const [filteredSlots, setFilteredSlots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAllSlots();
  }, [navigate]);

  useEffect(() => {
    // Filter slots by selected day
    const daySlots = slots.filter(slot => slot.dayOfWeek === selectedDay);
    setFilteredSlots(daySlots);
  }, [slots, selectedDay]);

  const fetchAllSlots = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/unified-time-slots/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      } else {
        console.error('Failed to fetch slots');
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (slotId) => {
    if (!window.confirm('Are you sure you want to approve this time slot assignment?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/unified-time-slots/admin/${slotId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert('Time slot approved successfully!');
        fetchAllSlots(); // Refresh data
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to approve time slot');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleReject = async (slotId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/unified-time-slots/admin/${slotId}/reject`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        alert('Time slot rejected successfully!');
        fetchAllSlots(); // Refresh data
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to reject time slot');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const getTimeSlotDisplay = (timeSlot) => {
    const timeMap = {
      '8-12': '8:00 AM - 12:00 PM',
      '12-4': '12:00 PM - 4:00 PM', 
      '4-8': '4:00 PM - 8:00 PM',
      '20-00': '8:00 PM - 12:00 AM'
    };
    return timeMap[timeSlot] || timeSlot;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#6c757d';
      case 'ASSIGNED': return '#28a745';
      case 'BOOKED': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AVAILABLE': return '⭕';
      case 'ASSIGNED': return '✅';
      case 'BOOKED': return '📅';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ color: '#333', fontSize: '20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>🕒 Time Slot Management</h1>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Day Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          {[0, 1, 2, 3, 4, 5, 6].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '12px 20px',
                backgroundColor: selectedDay === day ? '#007bff' : '#f8f9fa',
                color: selectedDay === day ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '100px'
              }}
            >
              {getDayName(day)}
            </button>
          ))}
        </div>

        {/* Current Day Info */}
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>
            📅 {getDayName(selectedDay)} Schedule
          </h3>
          <p style={{ margin: 0, color: '#1976d2', fontSize: '14px' }}>
            Managing time slots for {getDayName(selectedDay)}. Click on other days to view their schedules.
          </p>
        </div>

        {/* Time Slots Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredSlots.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>No time slots for {getDayName(selectedDay)}</p>
              <p style={{ fontSize: '14px', margin: 0, opacity: '0.8' }}>
                All time slots are available for doctor requests.
              </p>
            </div>
          ) : (
            filteredSlots.map((slot, index) => (
              <div key={index} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                transition: 'all 0.2s ease'
              }}>
                {/* Slot Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ margin: 0, color: '#333' }}>
                    {getTimeSlotDisplay(slot.timeSlot)}
                  </h4>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(slot.status),
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {getStatusIcon(slot.status)} {slot.status}
                  </span>
                </div>

                {/* Slot Details */}
                {slot.doctor ? (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>👨‍⚕️ Doctor:</strong> {slot.doctor.name}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>📧 Email:</strong> {slot.doctor.email}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>🏥 Specialty:</strong> {slot.doctor.specialty}
                    </p>
                    {slot.assignedAt && (
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>📅 Assigned:</strong> {new Date(slot.assignedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>👤 Doctor:</strong> <span style={{ color: '#999' }}>No doctor assigned</span>
                    </p>
                  </div>
                )}

                {/* Booking Info */}
                {slot.status === 'BOOKED' && (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>📅 Booked Dates:</strong> {slot.bookedDatesCount}
                    </p>
                    {slot.recentBookings && slot.recentBookings.length > 0 && (
                      <div>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                          <strong>Recent Bookings:</strong>
                        </p>
                        {slot.recentBookings.map((booking, idx) => (
                          <p key={idx} style={{ 
                            margin: '2px 0', 
                            color: '#666', 
                            fontSize: '12px',
                            paddingLeft: '10px'
                          }}>
                            • {new Date(booking.date).toLocaleDateString()} - {booking.status}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {slot.notes && (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>📝 Notes:</strong> {slot.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {slot.status === 'AVAILABLE' && slot.doctor && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    marginTop: '15px'
                  }}>
                    <button
                      onClick={() => handleApprove(slot._id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(slot._id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {slot.status === 'ASSIGNED' && (
                  <div style={{ 
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    padding: '10px',
                    marginTop: '15px'
                  }}>
                    <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>
                      ✅ <strong>Approved</strong> - This slot is available for patient bookings
                    </p>
                  </div>
                )}

                {slot.status === 'BOOKED' && (
                  <div style={{ 
                    backgroundColor: '#e2e3f1',
                    border: '1px solid #c5c6e8',
                    borderRadius: '4px',
                    padding: '10px',
                    marginTop: '15px'
                  }}>
                    <p style={{ margin: 0, color: '#4a4b6d', fontSize: '14px' }}>
                      📅 <strong>Active</strong> - Has patient bookings
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div style={{ 
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #bbdefb'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Slots</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>
              {filteredSlots.length}
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #c8e6c9'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Assigned</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#2e7d32' }}>
              {filteredSlots.filter(s => s.status === 'ASSIGNED').length}
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Pending</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#856404' }}>
              {filteredSlots.filter(s => s.status === 'AVAILABLE' && s.doctor).length}
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#f8d7da', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #f5c6cb'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Booked</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#721c24' }}>
              {filteredSlots.filter(s => s.status === 'BOOKED').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTimeSlotManagement;










