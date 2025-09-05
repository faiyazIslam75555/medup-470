// pages/EMRPage.jsx
// EMR (Electronic Medical Records) page for patients

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function EMRPage() {
  const [profile, setProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const navigate = useNavigate();

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to get appointment date field
  const getAppointmentDate = (appointment) => {
    return appointment.appointmentDate || appointment.date || appointment.scheduledDate;
  };

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
      const userDataString = localStorage.getItem('userData');
      console.log('Raw userData from localStorage:', userDataString);
      
      let userData = null;
      if (userDataString) {
        try {
          userData = JSON.parse(userDataString);
          console.log('Parsed userData:', userData);
        } catch (parseError) {
          console.error('Error parsing userData from localStorage:', parseError);
          localStorage.removeItem('userData'); // Remove corrupted data
        }
      }
      
      let extractedPatientId = userData?._id || userData?.id;
      console.log('Extracted patientId:', extractedPatientId);
      
      if (!userData) {
        console.log('No userData found in localStorage');
      }
      
      // If userData is missing, fetch it from the profile endpoint
      if (!extractedPatientId) {
        console.log('UserData missing, fetching from profile endpoint...');
        try {
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
            extractedPatientId = profileData._id || profileData.id;
            userData = profileData; // Update the userData variable
            // Store the profile data for future use
            localStorage.setItem('userData', JSON.stringify(profileData));
            console.log('UserData fetched and stored:', profileData);
          } else {
            console.error('Failed to fetch profile:', profileRes.status, profileRes.statusText);
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
      }
      
      if (!extractedPatientId) {
        console.error('Patient ID not found after all attempts. UserData:', userData);
        setLoading(false);
        return;
      }

      // Set the patientId state
      setPatientId(extractedPatientId);

      // Set profile data
      if (userData) {
        setProfile(userData);
      }

      // Fetch data - Only if extractedPatientId is available
      if (extractedPatientId) {
      // Fetch prescriptions
        try {
          const prescriptionsRes = await fetch(`${API_BASE_URL}/api/prescriptions/patient/${extractedPatientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        setPrescriptions(prescriptionsData.prescriptions || []);
          } else {
            console.log('Prescriptions endpoint not available, using empty array');
            setPrescriptions([]);
          }
        } catch (prescriptionError) {
          console.log('Error fetching prescriptions:', prescriptionError);
          setPrescriptions([]);
        }
        try {
          const appointmentsRes = await fetch(`${API_BASE_URL}/api/appointments/patient/${extractedPatientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
            // Ensure appointmentsData is an array
            const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : 
                                    Array.isArray(appointmentsData?.appointments) ? appointmentsData.appointments : [];
            setAppointments(appointmentsArray);
        } else {
          console.log('Appointments endpoint not available, using empty array');
          setAppointments([]);
        }
      } catch (appointmentError) {
        console.log('Error fetching appointments:', appointmentError);
        setAppointments([]);
      }

        // Fetch medical history using timeline endpoint
      try {
          const medicalHistoryRes = await fetch(`${API_BASE_URL}/api/timeline/patient/${extractedPatientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (medicalHistoryRes.ok) {
          const medicalHistoryData = await medicalHistoryRes.json();
            setMedicalHistory(medicalHistoryData.timeline || []);
        } else {
            console.log('Timeline endpoint not available, using empty array');
          setMedicalHistory([]);
        }
      } catch (medicalHistoryError) {
        console.log('Error fetching medical history:', medicalHistoryError);
          setMedicalHistory([]);
        }
      } else {
        // Set empty arrays if no patientId
        setAppointments([]);
        setMedicalHistory([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  // Payment handling functions
  const handlePaymentClick = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPrescription) return;

    try {
      const token = localStorage.getItem('userToken');
      
      // If invoiceId is not available, find invoice by prescription ID
      let invoiceId = selectedPrescription.invoiceId;
      if (!invoiceId) {
        // Find invoice by prescription ID
        const invoiceResponse = await fetch(`${API_BASE_URL}/api/invoices/prescription/${selectedPrescription._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          invoiceId = invoiceData._id;
        } else {
          throw new Error('Invoice not found for this prescription');
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          amount: selectedPrescription.totalAmount
        })
      });

      if (response.ok) {
        alert('Order confirmed! Your prescription is ready for pickup. Please pay in cash when you collect it from the pharmacy.');
        setShowPaymentModal(false);
        setSelectedPrescription(null);
        // Refresh prescriptions data
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPrescription(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '25px', 
                borderRadius: '12px', 
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                <h3 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '16px', fontWeight: '600' }}>Prescriptions</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>{Array.isArray(prescriptions) ? prescriptions.length : 0}</p>
              </div>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '25px', 
                borderRadius: '12px', 
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
                <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32', fontSize: '16px', fontWeight: '600' }}>Appointments</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#2e7d32' }}>{Array.isArray(appointments) ? appointments.length : 0}</p>
              </div>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '25px', 
                borderRadius: '12px', 
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏥</div>
                <h3 style={{ margin: '0 0 10px 0', color: '#c2185b', fontSize: '16px', fontWeight: '600' }}>Medical Tests</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#c2185b' }}>{Array.isArray(medicalHistory) ? medicalHistory.length : 0}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '25px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#333', marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>📊 Recent Activity</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* Recent Prescriptions */}
                {Array.isArray(prescriptions) && prescriptions.slice(0, 2).map((prescription, index) => (
                  <div key={`prescription-${index}`} style={{
                    padding: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💊 {prescription.disease || 'Prescription'}</h4>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString()}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Doctor:</strong> {prescription.doctor?.name || 'N/A'}</p>
                  </div>
                ))}

                {/* Recent Appointments */}
                {Array.isArray(appointments) && appointments.slice(0, 2).map((appointment, index) => (
                  <div key={`appointment-${index}`} style={{
                    padding: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    backgroundColor: '#e8f5e8',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>📅 Appointment</h4>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Date:</strong> {formatDate(getAppointmentDate(appointment))}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Doctor:</strong> {appointment.doctor?.name || appointment.doctorName || 'N/A'}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Status:</strong> {appointment.status}</p>
                  </div>
                ))}

              </div>
            </div>
          </div>
        );
      
      case 'medications':
        return (
          <div>
            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>💊 My Medications</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {Array.isArray(prescriptions) && prescriptions.map((prescription, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{prescription.disease || 'Prescription'}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Doctor:</strong> {prescription.doctor?.name || 'N/A'}
                  </p>
                  
                  {/* Display prescribed medicines */}
                  <div style={{ margin: '10px 0' }}>
                    <strong>Medicines:</strong>
                    {prescription.prescribedMedicines?.map((med, medIndex) => (
                      <div key={medIndex} style={{ marginLeft: '10px', margin: '5px 0', fontSize: '14px' }}>
                        • {med.medicineName} - {med.quantity}x ({med.instructions})
                      </div>
                    ))}
                  </div>

                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Total Amount:</strong> ${prescription.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: prescription.status === 'active' ? '#28a745' : 
                             prescription.status === 'completed' ? '#007bff' : '#dc3545'
                    }}>
                      {prescription.status}
                    </span>
                  </p>
                  
                  {/* Payment Button */}
                  {prescription.status === 'active' && prescription.totalAmount > 0 && (
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => handlePaymentClick(prescription)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          margin: '0 auto'
                        }}
                      >
                        💳 Pay Invoice (${prescription.totalAmount?.toFixed(2)})
                      </button>
                    </div>
                  )}
                  
                  {prescription.status === 'paid' && (
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '8px 16px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        ✅ Payment Completed
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {(!Array.isArray(prescriptions) || prescriptions.length === 0) && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  gridColumn: '1 / -1'
                }}>
                  No prescriptions found
                </div>
              )}
            </div>
          </div>
        );
      
      case 'appointments':
        return (
          <div>
            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>📅 My Appointments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {Array.isArray(appointments) && appointments.map((appointment, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                    {formatDate(getAppointmentDate(appointment))} 
                    {appointment.appointmentTime && ` at ${appointment.appointmentTime}`}
                  </h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Doctor:</strong> {appointment.doctor?.name || appointment.doctorName || 'N/A'}
                  </p>
                  {appointment.doctor?.specialty && (
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Specialty:</strong> {appointment.doctor.specialty}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: appointment.status === 'completed' ? '#28a745' : 
                             appointment.status === 'confirmed' ? '#007bff' : 
                             appointment.status === 'pending' ? '#ffc107' : '#dc3545'
                    }}>
                      {appointment.status}
                    </span>
                  </p>
                  {appointment.reason && (
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Reason:</strong> {appointment.reason}
                    </p>
                  )}
                  {appointment.notes && (
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                </div>
              ))}
              {(!Array.isArray(appointments) || appointments.length === 0) && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  gridColumn: '1 / -1'
                }}>
                  No appointments found
                </div>
              )}
            </div>
          </div>
        );
      
      case 'medical-records':
        return (
          <div>
            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>📋 Medical Records & Test Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {Array.isArray(medicalHistory) && medicalHistory.map((test, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{test.testType || test.type}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Date:</strong> {new Date(test.testDate || test.date).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Result:</strong> 
                    <span style={{ 
                      color: test.result === 'Normal' || test.result === 'normal' ? '#28a745' : 
                             test.result === 'Abnormal' || test.result === 'abnormal' ? '#dc3545' : '#ffc107'
                    }}>
                      {test.result}
                    </span>
                  </p>
                  {test.doctor && (
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Ordered by:</strong> {test.doctor.name || test.doctorName}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Details:</strong> {test.details || test.description || 'No additional details'}
                  </p>
                  {test.attachments && test.attachments.length > 0 && (
                    <div style={{ margin: '10px 0' }}>
                      <strong>Files:</strong>
                      {test.attachments.map((file, fileIndex) => (
                        <div key={fileIndex} style={{ marginLeft: '10px', fontSize: '14px' }}>
                          📎 {file.filename || file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(!Array.isArray(medicalHistory) || medicalHistory.length === 0) && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  gridColumn: '1 / -1'
                }}>
                  No medical history found
                </div>
              )}
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
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
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
          <div>
            <h1 style={{ color: '#333', margin: '0 0 10px 0' }}>📋 EMR Check - mediCore</h1>
            <p style={{ color: '#666', margin: 0 }}>View your electronic medical records and health information</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/patient-dashboard')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Dashboard
            </button>
            
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '5px', 
          marginBottom: '30px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '0',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          padding: '5px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'dashboard' ? '#007bff' : 'transparent',
              color: activeTab === 'dashboard' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'dashboard' ? '600' : '400',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('medical-records')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'medical-records' ? '#007bff' : 'transparent',
              color: activeTab === 'medical-records' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'medical-records' ? '600' : '400',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📋 Medical Records
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'medications' ? '#007bff' : 'transparent',
              color: activeTab === 'medications' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'medications' ? '600' : '400',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            💊 Medications
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'appointments' ? '#007bff' : 'transparent',
              color: activeTab === 'appointments' ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'appointments' ? '600' : '400',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📅 Appointments
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPrescription && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
              💵 Confirm Order
            </h3>
            
            {/* Prescription Summary */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Prescription Details</h4>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Condition:</strong> {selectedPrescription.disease}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Doctor:</strong> {selectedPrescription.doctor?.name || 'N/A'}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Date:</strong> {formatDate(selectedPrescription.createdAt)}
              </p>
              <div style={{ margin: '10px 0' }}>
                <strong>Medicines:</strong>
                {selectedPrescription.prescribedMedicines?.map((med, index) => (
                  <div key={index} style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                    • {med.medicineName} - {med.quantity}x ({med.instructions})
                  </div>
                ))}
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                Total Amount: ${selectedPrescription.totalAmount?.toFixed(2)}
              </p>
            </div>

            {/* Payment Note */}
            <div style={{
              backgroundColor: '#e8f5e8',
              border: '1px solid #c8e6c9',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#2e7d32',
              textAlign: 'center'
            }}>
              <strong>💵 Cash on Pickup</strong><br/>
              You can pay in cash when you pick up your prescription from the pharmacy. Click "Complete Payment" to confirm your order.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closePaymentModal}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💵 Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EMRPage;
