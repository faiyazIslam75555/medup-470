// pages/PatientDashboard.jsx
// Patient dashboard page - Integrated with advanced doctor search functionality

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, authenticatedApiCall } from '../utils/api';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('symptoms');
  const [query, setQuery] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [results, setResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/');
  };

  // Get symptom suggestions
  const getSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/triage/symptoms?query=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  // Add symptom to selected list
  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setQuery('');
    setSuggestions([]);
  };

  // Remove symptom from selected list
  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  // Clear all symptoms
  const clearAllSymptoms = () => {
    setSelectedSymptoms([]);
    setQuery('');
    setSuggestions([]);
    setResults(null);
  };

  // Search by symptoms using centralized triage system
  const searchBySymptoms = async () => {
    if (selectedSymptoms.length === 0) return;

    setSearchLoading(true);
    try {
      // First get triage recommendations
      const triageRes = await fetch(`${API_BASE_URL}/api/triage/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: selectedSymptoms })
      });

      if (triageRes.ok) {
        const triageData = await triageRes.json();
        
        // Then get available slots for the recommended specialty
        const slotsRes = await authenticatedApiCall('/api/unified-time-slots/patient/available');
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          
          // Filter slots by recommended specialty
          const matchingSlots = slotsData.availableSlots.filter(slot => 
            slot.doctor.specialty.toLowerCase().includes(triageData.recommendedSpecialty.toLowerCase())
          );
          
          // Group slots by doctor to show unique doctors
          const doctorMap = new Map();
          matchingSlots.forEach(slot => {
            const doctorId = slot.doctor.id;
            if (!doctorMap.has(doctorId)) {
              doctorMap.set(doctorId, {
                id: slot.doctor.id,
                name: slot.doctor.name,
                email: slot.doctor.email,
                specialty: slot.doctor.specialty,
                availableSlots: [],
                timeSlots: []
              });
            }
            
            const doctor = doctorMap.get(doctorId);
            doctor.availableSlots.push(...slot.availableDates.map(date => date.date));
            doctor.timeSlots.push({
              slotId: slot.slotId,
              dayOfWeek: slot.dayOfWeek,
              dayName: slot.dayName,
              timeSlot: slot.timeSlot,
              timeSlotDisplay: slot.timeSlot,
              availableDates: slot.availableDates.map(date => date.date)
            });
          });
          
          const uniqueDoctors = Array.from(doctorMap.values());
          console.log('🔍 Grouped unique doctors:', uniqueDoctors);
          
          setResults({
            ...triageData,
            recommendedDoctors: uniqueDoctors
          });
        } else {
          setResults(triageData);
        }
        console.log('Triage results:', triageData);
      } else {
        const errorData = await triageRes.json();
        console.error('Triage search error:', errorData);
        alert('Failed to search symptoms. Please try again.');
      }
    } catch (err) {
      console.error('Error searching symptoms:', err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Search by doctor name
  const searchByDoctorName = async () => {
    if (!doctorName.trim()) return;

    setSearchLoading(true);
    try {
      // First search for available slots
      const slotsRes = await authenticatedApiCall('/api/unified-time-slots/patient/available');
      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        
        // Filter slots by doctor name
        const matchingSlots = slotsData.availableSlots.filter(slot => 
          slot.doctor.name.toLowerCase().includes(doctorName.toLowerCase())
        );
        
        if (matchingSlots.length > 0) {
          // Group slots by doctor to show unique doctors
          const doctorMap = new Map();
          matchingSlots.forEach(slot => {
            const doctorId = slot.doctor.id;
            if (!doctorMap.has(doctorId)) {
              doctorMap.set(doctorId, {
                id: slot.doctor.id,
                name: slot.doctor.name,
                email: slot.doctor.email,
                specialty: slot.doctor.specialty,
                availableSlots: [],
                timeSlots: []
              });
            }
            
            const doctor = doctorMap.get(doctorId);
            doctor.availableSlots.push(...slot.availableDates.map(date => date.date));
            doctor.timeSlots.push({
              slotId: slot.slotId,
              dayOfWeek: slot.dayOfWeek,
              dayName: slot.dayName,
              timeSlot: slot.timeSlot,
              timeSlotDisplay: slot.timeSlot,
              availableDates: slot.availableDates.map(date => date.date)
            });
          });
          
          const uniqueDoctors = Array.from(doctorMap.values());
          console.log('🔍 Grouped unique doctors (by name):', uniqueDoctors);
          
          setResults({
            recommendedSpecialty: 'Doctor Name Search Results',
            recommendedDoctors: uniqueDoctors
          });
        } else {
          setResults({
            recommendedSpecialty: 'No Results Found',
            recommendedDoctors: []
          });
        }
      } else {
        setResults({
          recommendedSpecialty: 'No Results Found',
          recommendedDoctors: []
        });
      }
    } catch (err) {
      console.error('Error searching by doctor name:', err);
      setResults({
        recommendedSpecialty: 'Search Error',
        recommendedDoctors: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Navigate to appointment page for booking
  const bookAppointment = (slotId, date, doctor) => {
    navigate('/book-appointment', { 
      state: { 
        doctor: {
          id: doctor.id || doctor._id,
          name: doctor.name,
          specialty: doctor.specialty
        }
      }
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    getSuggestions(value);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header with EMR Button in Corner */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ color: '#333', margin: '0 0 10px 0' }}>
              What are your symptoms, {profile?.name || 'Patient'}?
            </h1>
            <p style={{ color: '#666', margin: 0 }}>Find the right specialist for your medical condition</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/vitals')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#20c997',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ❤️ Record Vitals
            </button>
            
            <button
              onClick={() => navigate('/emr')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📋 EMR Check
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('symptoms')}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === 'symptoms' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'symptoms' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              🩺 Search by Symptoms
            </button>
            <button
              onClick={() => setActiveTab('name')}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === 'name' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'name' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              👨‍⚕️ Search by Doctor Name
            </button>
          </div>

          {/* Symptoms Tab */}
          {activeTab === 'symptoms' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: '500', fontSize: '16px' }}>
                  What are your symptoms?
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Enter your medical condition"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    onClick={() => addSymptom(query)}
                    disabled={!query.trim()}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Add
                  </button>
                </div>
                
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div style={{ 
                    marginTop: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.map((symptom, index) => (
                      <div
                        key={index}
                        onClick={() => addSymptom(symptom)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                      >
                        {symptom}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Symptoms */}
              {selectedSymptoms.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>📋 MY Symptoms</h3>
                  {selectedSymptoms.map((symptom, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        margin: '5px',
                        padding: '8px 12px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '20px',
                        position: 'relative'
                      }}
                    >
                      {symptom}
                      <button
                        onClick={() => removeSymptom(symptom)}
                        style={{
                          marginLeft: '8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search and Clear Buttons */}
              {selectedSymptoms.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    onClick={searchBySymptoms}
                    disabled={searchLoading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    {searchLoading ? 'Searching...' : '🔍 Search by Specialty'}
                  </button>
                  
                  <button
                    onClick={clearAllSymptoms}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Clear All Symptoms
                  </button>
                </div>
              )}
            </>
          )}

          {/* Doctor Name Tab */}
          {activeTab === 'name' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: '500', fontSize: '16px' }}>
                  Doctor Name:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Enter doctor's name"
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    onClick={searchByDoctorName}
                    disabled={searchLoading || !doctorName.trim()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {searchLoading ? 'Searching...' : '🔍 Search Doctor'}
                  </button>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                textAlign: 'center',
                color: '#666'
              }}>
                <p style={{ margin: '0', fontSize: '16px' }}>Search for a specific doctor by name</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
                  Enter the doctor's name above to find their availability and book appointments.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Results */}
        {results && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>👨‍⚕️ Recommended Doctors</h3>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <p><strong>Specialty:</strong> {results.recommendedSpecialty}</p>
              {results.alternativeSpecialty && (
                <p><strong>Alternative:</strong> {results.alternativeSpecialty}</p>
              )}
              
              {results.recommendedDoctors && results.recommendedDoctors.length > 0 ? (
                results.recommendedDoctors.map((doctor, index) => (
                  <div key={index} style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{doctor.name}</h4>
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>Specialty:</strong> {doctor.specialty}</p>
                    {doctor.email && (
                      <p style={{ margin: '5px 0', color: '#666' }}><strong>Email:</strong> {doctor.email}</p>
                    )}
                    
                    {doctor.timeSlots && doctor.timeSlots.length > 0 && (
                      <div style={{ margin: '10px 0' }}>
                        <p style={{ margin: '5px 0', color: '#666', fontWeight: 'bold' }}>Available Time Slots:</p>
                        {doctor.timeSlots.map((timeSlot, slotIndex) => (
                          <div key={slotIndex} style={{ 
                            margin: '5px 0', 
                            padding: '8px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '4px',
                            border: '1px solid #e9ecef'
                          }}>
                            <p style={{ margin: '2px 0', color: '#333' }}>
                              <strong>{timeSlot.dayName} {timeSlot.timeSlot}</strong>
                            </p>
                            <p style={{ margin: '2px 0', color: '#666', fontSize: '14px' }}>
                              Available dates: {timeSlot.availableDates.slice(0, 5).join(', ')}
                              {timeSlot.availableDates.length > 5 && '...'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        // Navigate to appointment page with doctor info
                        navigate('/book-appointment', { 
                          state: { 
                            doctor: {
                              id: doctor.id || doctor._id,
                              name: doctor.name,
                              specialty: doctor.specialty,
                              email: doctor.email
                            }
                          }
                        });
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      📅 Book Appointment
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <p>No doctors available for this search at the moment.</p>
                  <p style={{ fontSize: '14px' }}>Please try again later or contact the clinic directly.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No symptoms message for symptoms tab */}
        {activeTab === 'symptoms' && selectedSymptoms.length === 0 && !results && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <p style={{ margin: '0', fontSize: '16px' }}>No symptoms added.</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
              Start typing above to add your symptoms and find the right specialist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
