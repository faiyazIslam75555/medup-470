// pages/DoctorDashboard.jsx

// Doctor dashboard with proper time slot and leave request functionality



import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../utils/api';


import TimelineTab from '../components/TimelineTab';


const DoctorDashboard = () => {

  const [patients, setPatients] = useState([]);

  const [appointments, setAppointments] = useState([]);

  const [leaveRequests, setLeaveRequests] = useState([]);

  const [timeSlots, setTimeSlots] = useState([]);



  const [slotRequestData, setSlotRequestData] = useState({

    dayOfWeek: [],

    timeSlot: '',

    notes: ''

  });



  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');

  
  
  // Form states

  const [showSlotRequestForm, setShowSlotRequestForm] = useState(false);

  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false);


  const [selectedPatient, setSelectedPatient] = useState(null);

  const [showPatientTimeline, setShowPatientTimeline] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [riskAnalysisData, setRiskAnalysisData] = useState(null);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [showRiskResult, setShowRiskResult] = useState(false);
  const [leaveRequestData, setLeaveRequestData] = useState({

    leaveType: 'vacation',

    startDate: '',

    endDate: '',

    reason: '',

    isEmergency: false

  });

  
  
  const navigate = useNavigate();



  useEffect(() => {

    const token = localStorage.getItem('userToken');

    if (!token) {

      navigate('/login');

      return;

    }

    fetchData();

  }, [navigate]);



  const fetchData = async () => {

    try {

      const token = localStorage.getItem('userToken');

      
      
      // Fetch patients

      const patientsRes = await fetch(`${API_BASE_URL}/api/doctor/patients`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (patientsRes.ok) {

        const patientsData = await patientsRes.json();

        setPatients(patientsData);

      }



      // Fetch leave requests

      const leaveRequestsRes = await fetch(`${API_BASE_URL}/api/doctor/leave-requests`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (leaveRequestsRes.ok) {

        const leaveRequestsData = await leaveRequestsRes.json();

        setLeaveRequests(leaveRequestsData);

      }



      // Fetch doctor's time slot requests
      const schedulesRes = await fetch(`${API_BASE_URL}/api/unified-time-slots/doctor/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }

      });

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setTimeSlots(schedulesData.slots || []);
      }



      // Fetch doctor's appointments

      const appointmentsRes = await fetch(`${API_BASE_URL}/api/appointments/doctor/me`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (appointmentsRes.ok) {

        const appointmentsData = await appointmentsRes.json();

        setAppointments(appointmentsData.appointments || []);

      }





    } catch (err) {

      console.error('Error fetching data:', err);

    } finally {

      setLoading(false);

    }

  };



  const handleLogout = () => {

    localStorage.removeItem('userToken');

    navigate('/');

  };



  // Doctor Schedule Request Functions
  const handleScheduleRequestSubmit = async (e) => {
    e.preventDefault();

    
    
    // Validate that at least one day is selected

    if (slotRequestData.dayOfWeek.length === 0) {

      alert('Please select at least one day');

      return;

    }

    
    
    try {

      const token = localStorage.getItem('userToken');

      
      // Submit requests for each selected day
      const promises = slotRequestData.dayOfWeek.map(day => 
        fetch(`${API_BASE_URL}/api/unified-time-slots/request`, {
        method: 'POST',

        headers: { 

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`

        },

          body: JSON.stringify({
            dayOfWeek: day,
            timeSlot: slotRequestData.timeSlot,
            notes: slotRequestData.notes
          })
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(res => res.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        alert(`✅ Successfully submitted ${successful} time slot request(s). Pending admin approval.\n${failed > 0 ? `\n⚠️ ${failed} request(s) failed.` : ''}`);
        setShowSlotRequestForm(false);

        setSlotRequestData({

          dayOfWeek: [],

          timeSlot: '',

          notes: ''

        });

        fetchData(); // Refresh data

      } else {

        alert('❌ Failed to submit any requests. Please try again.');
      }

    } catch (err) {

      alert('Network error. Please try again.');

    }

  };



  const getDayName = (dayNumber) => {

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return days[dayNumber];

  };



  const getStatusColor = (status) => {

    switch (status) {

      case 'PENDING': return '#ffc107';

      case 'ASSIGNED': return '#28a745';

      case 'REJECTED': return '#dc3545';

      case 'BOOKED': return '#6f42c1';

      default: return '#6c757d';

    }

  };



  const getAppointmentStatusColor = (status) => {

    switch (status) {

      case 'booked': return '#007bff';

      case 'confirmed': return '#28a745';

      case 'completed': return '#6c757d';

      case 'cancelled': return '#dc3545';

      case 'no-show': return '#ffc107';

      default: return '#6c757d';

    }

  };



  const getUrgencyColor = (urgency) => {

    switch (urgency) {

      case 'low': return '#28a745';

      case 'normal': return '#007bff';

      case 'high': return '#ffc107';

      case 'emergency': return '#dc3545';

      default: return '#6c757d';

    }

  };



  // Leave Request Functions

  const handleLeaveRequestSubmit = async (e) => {

    e.preventDefault();

    try {

      const token = localStorage.getItem('userToken');

      const res = await fetch(`${API_BASE_URL}/api/doctor/leave-requests`, {

        method: 'POST',

        headers: { 

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`

        },

        body: JSON.stringify(leaveRequestData)

      });



      if (res.ok) {

        alert('Leave request submitted successfully!');

        setShowLeaveRequestForm(false);

        setLeaveRequestData({

          leaveType: 'vacation',

          startDate: '',

          endDate: '',

          reason: '',

          isEmergency: false

        });

        fetchData(); // Refresh data

      } else {

        const errorData = await res.json();

        alert(errorData.message || 'Failed to submit request');

      }

    } catch (err) {

      alert('Network error. Please try again.');

    }

  };



  const cancelLeaveRequest = async (id) => {

    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

    
    
    try {

      const token = localStorage.getItem('userToken');

      const res = await fetch(`${API_BASE_URL}/api/doctor/leave-requests/${id}`, {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${token}` }

      });



      if (res.ok) {

        alert('Leave request cancelled successfully!');

        fetchData(); // Refresh data

      } else {

        const errorData = await res.json();

        alert(errorData.message || 'Failed to cancel request');

      }

    } catch (err) {

      alert('Network error. Please try again.');

    }

  };





  const viewPatientTimeline = (patient) => {
    setSelectedPatient(patient);

    setShowPatientTimeline(true);
  };

  // AI Risk Analysis Functions
  const analyzePatientRisk = async (patientId) => {
    if (!patientId) {
      alert('Error: No patient ID found');
      return;
    }

    try {
      setAnalyzingRisk(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/ai-risk/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRiskAnalysisData(data);
        setShowRiskAnalysis(true);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to analyze patient risk');
      }
    } catch (error) {
      console.error('Error analyzing patient risk:', error);
      alert('Network error. Please try again.');
    } finally {
      setAnalyzingRisk(false);
    }
  };

  const analyzeAllPatientsRisk = async () => {
    if (!window.confirm('⚠️ This will analyze ALL patients using AI (limited calls). Continue?')) {
      return;
    }

    try {
      setAnalyzingRisk(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/ai-risk/riskiest-patient`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRiskAnalysisData(data);
        setShowRiskAnalysis(true);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to analyze patients risk');
      }
    } catch (error) {
      console.error('Error analyzing patients risk:', error);
      alert('Network error. Please try again.');
    } finally {
      setAnalyzingRisk(false);
    }
  };




  const renderTabContent = () => {

    switch (activeTab) {

      case 'overview':

        return (

          <div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>

              <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>

                <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>👥 Patients</h3>

                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>{patients.length}</p>

              </div>

              <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>

                <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>⏰ Time Slots</h3>

                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#2e7d32' }}>{timeSlots.length}</p>

              </div>

              <div style={{ backgroundColor: '#fce4ec', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>

                <h3 style={{ margin: '0 0 10px 0', color: '#c2185b' }}>📅 Pending Requests</h3>

                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#c2185b' }}>{leaveRequests.length}</p>

              </div>

              <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>

                <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>📋 Appointments</h3>

                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#856404' }}>{appointments.length}</p>

              </div>



            </div>



            {/* Quick Actions */}

            <div style={{ 

              display: 'grid', 

              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 

              gap: '20px',

              marginTop: '30px'

            }}>

              <button

                onClick={() => setShowSlotRequestForm(true)}

                style={{

                  padding: '15px',

                  backgroundColor: '#007bff',

                  color: 'white',

                  border: 'none',

                  borderRadius: '8px',

                  cursor: 'pointer',

                  fontSize: '16px'

                }}

              >

                ⏰ Request Weekly Schedule
              </button>

              <button

                onClick={() => setShowLeaveRequestForm(true)}

                style={{

                  padding: '15px',

                  backgroundColor: '#28a745',

                  color: 'white',

                  border: 'none',

                  borderRadius: '8px',

                  cursor: 'pointer',

                  fontSize: '16px'

                }}

              >

                📅 Request Leave

              </button>

               <button
                 onClick={analyzeAllPatientsRisk}
                 disabled={analyzingRisk}
                 style={{
                   padding: '15px',
                   backgroundColor: analyzingRisk ? '#6c757d' : '#dc3545',
                   color: 'white',
                   border: 'none',
                   borderRadius: '8px',
                   cursor: analyzingRisk ? 'not-allowed' : 'pointer',
                   fontSize: '16px',
                   opacity: analyzingRisk ? 0.6 : 1
                 }}
               >
                 {analyzingRisk ? '🔍 Analyzing...' : '🚨 Find Riskiest Patient'}
               </button>


            </div>

          </div>

        );
      
      
      
      case 'patients':

        return (

          <div>

            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>👥 My Patients</h2>

            {patients.length === 0 ? (

              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>

                <p>No patients assigned yet.</p>

              </div>

            ) : (

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

                {patients.map((patient, index) => (

                  <div key={index} style={{

                    border: '1px solid #ddd',

                    borderRadius: '8px',

                    padding: '20px',

                    backgroundColor: '#f8f9fa',

                    transition: 'all 0.2s ease'

                  }}

                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}

                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}

                  >

                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{patient.user?.name || 'Unknown Patient'}</h3>

                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Email:</strong> {patient.user?.email || 'N/A'}</p>

                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Phone:</strong> {patient.user?.phoneNumber || 'N/A'}</p>

                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Status:</strong> {patient.status}</p>
                    {patient.lastAppointment && (
                      <p style={{ margin: '5px 0', color: '#666' }}><strong>Last Appointment:</strong> {new Date(patient.lastAppointment).toLocaleDateString()}</p>
                    )}

                    <div style={{ 

                      display: 'flex', 
                      gap: '10px', 
                      marginTop: '15px'
                    }}>
                      <button
                        onClick={() => viewPatientTimeline(patient)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#17a2b8',
                      color: 'white', 

                          border: 'none',
                      borderRadius: '5px',

                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        📅 Health Timeline
                      </button>
                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        );



      case 'time-slots':

        return (

          <div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

              <h2 style={{ color: '#007bff', margin: 0 }}>⏰ My Time Slots</h2>

              <button

                onClick={() => setShowSlotRequestForm(true)}

                style={{

                  padding: '10px 20px',

                  backgroundColor: '#007bff',

                  color: 'white',

                  border: 'none',

                  borderRadius: '5px',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '8px'

                }}

              >

                ➕ Request New Schedule
              </button>

            </div>

            
            
            <div style={{ marginBottom: '30px' }}>

              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>📅 Weekly Schedules ({timeSlots.length})</h3>
              {timeSlots.length === 0 ? (

                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>

                  <p>No weekly schedules created yet. Create a recurring schedule to get started!</p>
                </div>

              ) : (

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

                  {timeSlots.map((schedule, index) => (
                    <div key={index} style={{

                      border: '1px solid #ddd',

                      borderRadius: '8px',

                      padding: '20px',

                      backgroundColor: '#f8f9fa'

                    }}>

                      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>

                        {schedule.dayName} - {schedule.timeSlotDisplay || schedule.timeSlot}
                      </h4>

                      <p style={{ margin: '5px 0', color: '#666' }}>

                        <strong>Status:</strong> 

                        <span style={{ 

                          color: schedule.status === 'ASSIGNED' ? '#28a745' : 
                                 schedule.status === 'AVAILABLE' ? '#ffc107' : 
                                 schedule.status === 'BOOKED' ? '#6f42c1' : '#6c757d',
                          fontWeight: 'bold',

                          marginLeft: '5px'

                        }}>

                          {schedule.status}
                        </span>

                      </p>

                      {schedule.status === 'ASSIGNED' && (
                        <>
                        <p style={{ margin: '5px 0', color: '#666' }}>

                            <strong>Assigned:</strong> {schedule.assignedAt ? new Date(schedule.assignedAt).toLocaleDateString() : 'N/A'}
                          </p>
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Booked Dates:</strong> {schedule.bookedDatesCount || 0}
                          </p>
                          {schedule.nextAvailableDate && (
                            <p style={{ margin: '5px 0', color: '#28a745' }}>
                              <strong>Next Available:</strong> {schedule.nextAvailableDate}
                        </p>

                      )}

                        </>
                      )}
                      {schedule.status === 'AVAILABLE' && (
                        <p style={{ margin: '5px 0', color: '#ffc107' }}>
                          <strong>⏳ Waiting for admin approval</strong>
                        </p>
                      )}
                      {schedule.status === 'BOOKED' && (
                        <p style={{ margin: '5px 0', color: '#6f42c1' }}>
                          <strong>📅 Slot has patient bookings</strong>
                        </p>
                      )}
                      {schedule.notes && (
                        <p style={{ margin: '5px 0', color: '#666' }}>

                          <strong>Notes:</strong> {schedule.notes}
                        </p>

                      )}

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        );
      
      
      
      case 'appointments':

        return (

          <div>

            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>📋 My Appointments</h2>

            {appointments.length === 0 ? (

              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>

                <p>No appointments scheduled yet.</p>

              </div>

            ) : (

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>

                {appointments.map((appointment, index) => (

                  <div key={index} style={{

                    border: '1px solid #ddd',

                    borderRadius: '8px',

                    padding: '20px',

                    backgroundColor: '#f8f9fa'

                  }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>

                      <h3 style={{ margin: '0', color: '#333' }}>Patient: {appointment.user?.name || 'Unknown'}</h3>

                      <span style={{

                        padding: '4px 8px',

                        backgroundColor: getAppointmentStatusColor(appointment.status),

                        color: 'white',

                        borderRadius: '12px',

                        fontSize: '12px',

                        fontWeight: 'bold'

                      }}>

                        {appointment.status}

                      </span>

                    </div>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString('en-US', { 

                        weekday: 'long', 

                        year: 'numeric', 

                        month: 'long', 

                        day: 'numeric' 

                      })}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Time:</strong> {appointment.timeSlot}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Reason:</strong> {appointment.reason}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Urgency:</strong> 

                      <span style={{ 

                        color: getUrgencyColor(appointment.urgency),

                        fontWeight: 'bold',

                        marginLeft: '5px'

                      }}>

                        {appointment.urgency}

                      </span>

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Email:</strong> {appointment.user?.email || 'N/A'}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Phone:</strong> {appointment.user?.phoneNumber || 'N/A'}

                    </p>

                  </div>

                ))}

              </div>

            )}

          </div>

        );
      
      
      
      case 'requests':

        return (

          <div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

              <h2 style={{ color: '#007bff', margin: 0 }}>📅 Leave Requests</h2>

              <button

                onClick={() => setShowLeaveRequestForm(true)}

                style={{

                  padding: '10px 20px',

                  backgroundColor: '#28a745',

                  color: 'white',

                  border: 'none',

                  borderRadius: '5px',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '8px'

                }}

              >

                ➕ New Request

              </button>

            </div>

            
            
            <div style={{ marginBottom: '30px' }}>

              <h3 style={{ color: '#28a745', marginBottom: '15px' }}>🏖️ Leave Requests ({leaveRequests.length})</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

                {leaveRequests.map((request, index) => (

                  <div key={index} style={{

                    border: '1px solid #ddd',

                    borderRadius: '8px',

                    padding: '20px',

                    backgroundColor: '#f8f9fa'

                  }}>

                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>

                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}

                    </h4>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Type:</strong> {request.leaveType}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Reason:</strong> {request.reason}

                    </p>

                    <p style={{ margin: '5px 0', color: '#666' }}>

                      <strong>Status:</strong> <span style={{ color: '#ffc107' }}>{request.status}</span>

                    </p>

                    {request.status === 'pending' && (

                      <button

                        onClick={() => cancelLeaveRequest(request._id)}

                        style={{

                          padding: '8px 16px',

                          backgroundColor: '#dc3545',

                          color: 'white',

                          border: 'none',

                          borderRadius: '4px',

                          cursor: 'pointer',

                          marginTop: '10px'

                        }}

                      >

                        Cancel Request

                      </button>

                    )}

                  </div>

                ))}

              </div>

            </div>

          </div>

        );
      
      


      

      
      default:

        return null;

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

        <div style={{ 

          display: 'flex', 

          justifyContent: 'space-between', 

          alignItems: 'center',

          marginBottom: '30px'

        }}>

          <h1 style={{ color: '#333', margin: 0 }}>👨‍⚕️ Doctor Dashboard - mediCore</h1>

          <button 

            onClick={handleLogout} 

            style={{ 

              padding: '10px 20px',

              backgroundColor: '#dc3545', 

              color: 'white', 

              border: 'none', 

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            Logout

          </button>

        </div>



        {/* Tab Navigation */}

        <div style={{ 

          display: 'flex', 

          gap: '10px', 

          marginBottom: '30px',

          borderBottom: '2px solid #eee',

          paddingBottom: '10px'

        }}>

          <button

            onClick={() => setActiveTab('overview')}

            style={{

              padding: '10px 20px',

              backgroundColor: activeTab === 'overview' ? '#007bff' : '#f8f9fa',

              color: activeTab === 'overview' ? 'white' : '#333',

              border: '1px solid #ddd',

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            📊 Overview

          </button>

          <button

            onClick={() => setActiveTab('patients')}

            style={{

              padding: '10px 20px',

              backgroundColor: activeTab === 'patients' ? '#007bff' : '#f8f9fa',

              color: activeTab === 'patients' ? 'white' : '#333',

              border: '1px solid #ddd',

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            👥 Patients

          </button>

          <button

            onClick={() => setActiveTab('time-slots')}

            style={{

              padding: '10px 20px',

              backgroundColor: activeTab === 'time-slots' ? '#007bff' : '#f8f9fa',

              color: activeTab === 'time-slots' ? 'white' : '#333',

              border: '1px solid #ddd',

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            ⏰ Time Slots

          </button>

          <button

            onClick={() => setActiveTab('appointments')}

            style={{

              padding: '10px 20px',

              backgroundColor: activeTab === 'appointments' ? '#007bff' : '#f8f9fa',

              color: activeTab === 'appointments' ? 'white' : '#333',

              border: '1px solid #ddd',

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            📋 Appointments

          </button>

          <button

            onClick={() => setActiveTab('requests')}

            style={{

              padding: '10px 20px',

              backgroundColor: activeTab === 'requests' ? '#007bff' : '#f8f9fa',

              color: activeTab === 'requests' ? 'white' : '#333',

              border: '1px solid #ddd',

              borderRadius: '5px',

              cursor: 'pointer'

            }}

          >

            📅 Requests

          </button>



        </div>



        {/* Tab Content */}

        {renderTabContent()}

      </div>



      {/* Time Slot Request Modal */}

      {showSlotRequestForm && (

        <div style={{

          position: 'fixed',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          backgroundColor: 'rgba(0,0,0,0.5)',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          zIndex: 1000

        }}>

          <div style={{

            backgroundColor: 'white',

            padding: '30px',

            borderRadius: '10px',

            width: '90%',

            maxWidth: '500px'

          }}>

            <h2 style={{ marginBottom: '20px', color: '#333' }}>Request Recurring Weekly Schedule</h2>
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb',
              borderRadius: '5px',
              padding: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#1976d2'
            }}>
              💡 <strong>Note:</strong> This will request a recurring weekly schedule for the whole year. Your request will be reviewed by admin before approval. Patients can then book specific dates from your approved slots.
            </div>
            <form onSubmit={handleScheduleRequestSubmit}>
              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Select Days:

                </label>

                <div style={{ marginBottom: '10px' }}>

                  {[

                    { value: 0, label: 'Sunday' },

                    { value: 1, label: 'Monday' },

                    { value: 2, label: 'Tuesday' },

                    { value: 3, label: 'Wednesday' },

                    { value: 4, label: 'Thursday' },

                    { value: 5, label: 'Friday' },

                    { value: 6, label: 'Saturday' }

                  ].map(day => (

                    <label key={day.value} style={{ display: 'block', marginBottom: '5px' }}>

                      <input

                        type="checkbox"

                        checked={slotRequestData.dayOfWeek.includes(day.value)}

                        onChange={(e) => {

                          if (e.target.checked) {

                            setSlotRequestData({

                              ...slotRequestData,

                              dayOfWeek: [...slotRequestData.dayOfWeek, day.value]

                            });

                          } else {

                            setSlotRequestData({

                              ...slotRequestData,

                              dayOfWeek: slotRequestData.dayOfWeek.filter(d => d !== day.value)

                            });

                          }

                        }}

                      />

                      {day.label}

                    </label>

                  ))}

                </div>

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Time Slot:

                </label>

                <select

                  value={slotRequestData.timeSlot}

                  onChange={(e) => setSlotRequestData({...slotRequestData, timeSlot: e.target.value})}

                  required

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px'

                  }}

                >

                  <option value="">Select a time slot</option>

                  <option value="8-12">8:00 AM - 12:00 PM</option>

                  <option value="12-4">12:00 PM - 4:00 PM</option>

                  <option value="4-8">4:00 PM - 8:00 PM</option>

                  <option value="20-00">8:00 PM - 12:00 AM</option>

                </select>

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Notes (Optional):

                </label>

                <textarea

                  value={slotRequestData.notes}

                  onChange={(e) => setSlotRequestData({...slotRequestData, notes: e.target.value})}

                  rows="3"

                  placeholder="Any additional notes for this time slot request"

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px',

                    resize: 'vertical'

                  }}

                />

              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>

                <button

                  type="button"

                  onClick={() => setShowSlotRequestForm(false)}

                  style={{

                    padding: '10px 20px',

                    backgroundColor: '#6c757d',

                    color: 'white',

                    border: 'none',

                    borderRadius: '5px',

                    cursor: 'pointer'

                  }}

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  style={{

                    padding: '10px 20px',

                    backgroundColor: '#007bff',

                    color: 'white',

                    border: 'none',

                    borderRadius: '5px',

                    cursor: 'pointer'

                  }}

                >

                  Submit Request

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Leave Request Modal */}

      {showLeaveRequestForm && (

        <div style={{

          position: 'fixed',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          backgroundColor: 'rgba(0,0,0,0.5)',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          zIndex: 1000

        }}>

          <div style={{

            backgroundColor: 'white',

            padding: '30px',

            borderRadius: '10px',

            width: '90%',

            maxWidth: '500px'

          }}>

            <h2 style={{ marginBottom: '20px', color: '#333' }}>Request Leave</h2>

            <form onSubmit={handleLeaveRequestSubmit}>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Leave Type:

                </label>

                <select

                  value={leaveRequestData.leaveType}

                  onChange={(e) => setLeaveRequestData({...leaveRequestData, leaveType: e.target.value})}

                  required

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px'

                  }}

                >

                  <option value="vacation">Annual Leave</option>

                  <option value="sick_leave">Sick Leave</option>

                  <option value="personal_leave">Personal Leave</option>

                  <option value="emergency_leave">Emergency Leave</option>

                  <option value="maternity_leave">Maternity Leave</option>

                  <option value="paternity_leave">Paternity Leave</option>

                  <option value="bereavement_leave">Bereavement Leave</option>

                  <option value="other">Other</option>

                </select>

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Start Date:

                </label>

                <input

                  type="date"

                  value={leaveRequestData.startDate}

                  onChange={(e) => setLeaveRequestData({...leaveRequestData, startDate: e.target.value})}

                  required

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px'

                  }}

                />

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  End Date:

                </label>

                <input

                  type="date"

                  value={leaveRequestData.endDate}

                  onChange={(e) => setLeaveRequestData({...leaveRequestData, endDate: e.target.value})}

                  required

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px'

                  }}

                />

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>

                  Reason:

                </label>

                <textarea

                  value={leaveRequestData.reason}

                  onChange={(e) => setLeaveRequestData({...leaveRequestData, reason: e.target.value})}

                  required

                  rows="3"

                  style={{

                    width: '100%',

                    padding: '12px',

                    border: '1px solid #ddd',

                    borderRadius: '5px',

                    fontSize: '16px',

                    resize: 'vertical'

                  }}

                />

              </div>

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                  <input

                    type="checkbox"

                    checked={leaveRequestData.isEmergency}

                    onChange={(e) => setLeaveRequestData({...leaveRequestData, isEmergency: e.target.checked})}

                    style={{ transform: 'scale(1.2)' }}

                  />

                  <span style={{ color: '#555' }}>Emergency Leave</span>

                </label>

              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>

                <button

                  type="button"

                  onClick={() => setShowLeaveRequestForm(false)}

                  style={{

                    padding: '10px 20px',

                    backgroundColor: '#6c757d',

                    color: 'white',

                    border: 'none',

                    borderRadius: '5px',

                    cursor: 'pointer'

                  }}

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  style={{

                    padding: '10px 20px',

                    backgroundColor: '#28a745',

                    color: 'white',

                    border: 'none',

                    borderRadius: '5px',

                    cursor: 'pointer'

                  }}

                >

                  Submit Request

                </button>

              </div>

            </form>

          </div>

        </div>

      )}





      {/* Patient Timeline Modal */}
      {showPatientTimeline && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '15px'
            }}>
              <div>
                <h2 style={{ color: '#007bff', margin: '0 0 5px 0' }}>
                  📅 Health Timeline - {selectedPatient.user?.name || 'Patient'}
                </h2>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                  View patient's complete health history and recent activities
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                 <button
                   onClick={() => analyzePatientRisk(selectedPatient.user?._id)}
                   style={{
                     padding: '8px 16px',
                     backgroundColor: '#ffc107',
                     color: '#333',
                     border: 'none',
                     borderRadius: '5px',
                     cursor: 'pointer',
                     fontSize: '14px',
                     fontWeight: '500',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '5px'
                   }}
                 >
                   🔍 AI Risk Analysis
                 </button>
                <button
                  onClick={() => {
                    setShowPatientTimeline(false);
            setSelectedPatient(null);

          }}

                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <TimelineTab 
              patientId={selectedPatient.user?._id} 
              patientName={selectedPatient.user?.name}
            />
          </div>
        </div>
      )}

      {/* AI Risk Analysis Modal */}
      {showRiskAnalysis && riskAnalysisData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '15px'
            }}>
              <div>
                <h2 style={{ color: '#dc3545', margin: '0 0 5px 0' }}>
                  🚨 AI Risk Analysis Results
                </h2>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                  {riskAnalysisData.patient ? 
                    `Analysis for ${riskAnalysisData.patient.name}` : 
                    `Analysis for ${riskAnalysisData.totalPatients || 0} patients`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRiskAnalysis(false);
                  setRiskAnalysisData(null);
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Risk Analysis Content */}
            <div style={{ marginBottom: '20px' }}>
              {riskAnalysisData.riskiestPatient ? (
                // Multiple patients ranking (showing the riskiest one)
                <MultiplePatientsRiskRanking data={riskAnalysisData} />
              ) : (
                // No patients found
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No patients found for risk analysis
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Single Patient Risk Analysis Component
const SinglePatientRiskAnalysis = ({ data }) => {
  const { riskAssessment, analyzedData } = data;
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return '#28a745';
      case 'MEDIUM': return '#ffc107';
      case 'HIGH': return '#fd7e14';
      case 'CRITICAL': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      {/* Risk Level Badge */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: `3px solid ${getRiskColor(riskAssessment.level)}`
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
          {riskAssessment.level === 'LOW' ? '🟢' : 
           riskAssessment.level === 'MEDIUM' ? '🟡' : 
           riskAssessment.level === 'HIGH' ? '🟠' : '🔴'}
        </div>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: getRiskColor(riskAssessment.level),
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Risk Level: {riskAssessment.level}
        </h3>
        <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
          Risk Score: {riskAssessment.score}/10
        </p>
        <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
          Urgency: {riskAssessment.urgency}
        </p>
      </div>

      {/* Risk Factors */}
      {riskAssessment.factors && riskAssessment.factors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#dc3545', marginBottom: '10px' }}>🚨 Key Risk Factors:</h4>
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '5px',
            padding: '15px'
          }}>
            {riskAssessment.factors.map((factor, index) => (
              <div key={index} style={{
                padding: '8px 0',
                borderBottom: index < riskAssessment.factors.length - 1 ? '1px solid #fed7d7' : 'none'
              }}>
                • {factor}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#28a745', marginBottom: '10px' }}>💡 Recommendations:</h4>
          <div style={{
            backgroundColor: '#f0fff4',
            border: '1px solid #c6f6d5',
            borderRadius: '5px',
            padding: '15px'
          }}>
            {riskAssessment.recommendations.map((rec, index) => (
              <div key={index} style={{
                padding: '8px 0',
                borderBottom: index < riskAssessment.recommendations.length - 1 ? '1px solid #c6f6d5' : 'none'
              }}>
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyzed Data Summary */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4 style={{ color: '#007bff', marginBottom: '10px' }}>📊 Data Analyzed:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💓</div>
            <div style={{ fontWeight: 'bold', color: '#dc3545' }}>
              {analyzedData.emr?.vitals?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Vitals Records</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏥</div>
            <div style={{ fontWeight: 'bold', color: '#007bff' }}>
              {analyzedData.appointments?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Appointments</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💊</div>
            <div style={{ fontWeight: 'bold', color: '#28b745' }}>
              {analyzedData.prescriptions?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Prescriptions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Multiple Patients Risk Ranking Component
const MultiplePatientsRiskRanking = ({ data }) => {
  const { riskiestPatient, analyzedPatients } = data;
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return '#28a745';
      case 'MEDIUM': return '#ffc107';
      case 'HIGH': return '#fd7e14';
      case 'CRITICAL': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
          📊 Risk Analysis Complete
        </h4>
        <p style={{ margin: 0, color: '#856404' }}>
          Analyzed {analyzedPatients} patients
        </p>
      </div>

      <h4 style={{ color: '#dc3545', marginBottom: '15px' }}>🚨 Most At-Risk Patient:</h4>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {riskiestPatient ? (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
            backgroundColor: '#f8f9fa',
            borderLeft: `4px solid ${getRiskColor(riskiestPatient.riskLevel)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  backgroundColor: getRiskColor(riskiestPatient.riskLevel),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  #1
                </span>
                <h5 style={{ margin: 0, color: '#333' }}>{riskiestPatient.name}</h5>
              </div>
              <div style={{
                backgroundColor: getRiskColor(riskiestPatient.riskLevel),
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {riskiestPatient.riskLevel} RISK
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>Risk Score</div>
                <div style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {riskiestPatient.riskLevel}/10
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>Reason</div>
                <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                  {riskiestPatient.reason}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No patients found for risk analysis
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '5px',
        padding: '15px',
        marginTop: '20px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        💡 <strong>Note:</strong> This shows the single most at-risk patient based on AI analysis of all patients. 
        Focus on this patient first for immediate care.
      </div>
    </div>

  );

};



export default DoctorDashboard;







