import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

function TimelineTab({ patientId, patientName }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Prescription form state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    disease: '',
    medicines: []
  });
  
  // Medicine search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchTimeline();
    }
  }, [patientId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/timeline/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      } else {
        setError('Failed to fetch timeline data');
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Search medicines
  const searchMedicines = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/search?query=${query}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Error searching medicines:', err);
    }
  };

  // Add medicine to prescription
  const addMedicine = (medicine) => {
    // Check if medicine is out of stock
    if (medicine.quantity <= 0) {
      alert(`⚠️ ${medicine.name} is currently out of stock and cannot be prescribed.`);
      return;
    }
    
    // Check if medicine is low stock
    if (medicine.quantity <= medicine.reorderThreshold) {
      const confirm = window.confirm(
        `⚠️ ${medicine.name} is low in stock (${medicine.quantity} remaining). Do you want to proceed with prescribing it?`
      );
      if (!confirm) return;
    }
    
    const newMedicine = {
      medicineId: medicine._id,
      medicineName: medicine.name,
      quantity: 1,
      price: medicine.price,
      instructions: '',
      frequency: 1, // Number of times per day
      total: medicine.price
    };
    
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine]
    }));
    
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // Remove medicine from prescription
  const removeMedicine = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  // Update medicine details
  const updateMedicine = (index, field, value) => {
    setPrescriptionForm(prev => {
      const updatedMedicines = [...prev.medicines];
      updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
      
      // Recalculate total
      if (field === 'quantity' || field === 'price') {
        const quantity = field === 'quantity' ? value : updatedMedicines[index].quantity;
        const price = field === 'price' ? value : updatedMedicines[index].price;
        updatedMedicines[index].total = quantity * price;
      }
      
      return { ...prev, medicines: updatedMedicines };
    });
  };

  // Handle prescription submit
  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.disease || prescriptionForm.medicines.length === 0) {
      alert('Please fill all required fields and add at least one medicine');
      return;
    }
    
    // Debug: Check if patientId is valid
    console.log('TimelineTab - patientId received:', patientId);
    console.log('TimelineTab - patientId type:', typeof patientId);
    
    if (!patientId) {
      alert('Error: No patient ID found. Please refresh and try again.');
      return;
    }
    
    try {
      const token = localStorage.getItem('userToken');
      
      const prescriptionPayload = {
        patient: patientId,
        disease: prescriptionForm.disease,
        prescribedMedicines: prescriptionForm.medicines
      };
      
      console.log('Creating prescription with payload:', prescriptionPayload);
      console.log('Patient ID in payload:', prescriptionPayload.patient);
      console.log('Patient ID type in payload:', typeof prescriptionPayload.patient);

      const res = await fetch(`${API_BASE_URL}/api/doctor/prescriptions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(prescriptionPayload)
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Prescription created successfully!\nInvoice #${result.invoice} has been generated automatically.`);
        setPrescriptionForm({ disease: '', medicines: [] });
        setShowPrescriptionForm(false);
        fetchTimeline(); // Refresh timeline data
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to create prescription');
      }
    } catch (err) {
      console.error('Error creating prescription:', err);
      alert('Network error. Please try again.');
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'appointment':
        return '🏥';
      case 'prescription':
        return '💊';
      case 'vitals':
        return '💓';
      default:
        return '📋';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'appointment':
        return '#007bff';
      case 'prescription':
        return '#28a745';
      case 'vitals':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px', color: '#dc3545' }}>❌</div>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button 
          onClick={fetchTimeline}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>📅</div>
        <p style={{ color: '#666' }}>No timeline events found.</p>
        <p style={{ color: '#999', fontSize: '14px' }}>
          This patient's health timeline will appear here once they have appointments, prescriptions, or vitals recorded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ color: '#333', margin: 0 }}>
            📊 Timeline Summary
          </h3>
          <button
            onClick={() => setShowPrescriptionForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            💊 Write Prescription
          </button>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏥</div>
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
              {timeline.filter(e => e.type === 'appointment').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Appointments</div>
          </div>
          
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💊</div>
            <div style={{ fontWeight: 'bold', color: '#388e3c' }}>
              {timeline.filter(e => e.type === 'prescription').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Prescriptions</div>
          </div>
          
          <div style={{
            backgroundColor: '#ffebee',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #ffcdd2'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💓</div>
            <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>
              {timeline.filter(e => e.type === 'vitals').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Vitals Records</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>
          📅 Recent Events
        </h3>
        
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: '#e0e0e0'
          }} />
          
          {timeline.map((event, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: '20px',
              position: 'relative'
            }}>
              {/* Timeline dot */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: getEventColor(event.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                marginRight: '20px',
                flexShrink: 0,
                zIndex: 1
              }}>
                {getEventIcon(event.type)}
              </div>
              
              {/* Event content */}
              <div style={{
                flex: 1,
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: getEventColor(event.type),
                    fontSize: '16px'
                  }}>
                    {event.title}
                  </h4>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    {formatDate(event.date)}
                  </span>
                </div>
                
                <p style={{ 
                  margin: '8px 0', 
                  color: '#333',
                  fontSize: '14px'
                }}>
                  {event.description}
                </p>
                
                {event.status && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    backgroundColor: event.status === 'active' ? '#d4edda' : '#fff3cd',
                    color: event.status === 'active' ? '#155724' : '#856404',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Write Prescription{patientName ? ` for ${patientName}` : ''}
            </h3>
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb',
              borderRadius: '5px',
              padding: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#1976d2'
            }}>
              💡 <strong>Note:</strong> An invoice will be automatically generated when you create this prescription. The invoice will include all prescribed medicines with current prices and availability status.
            </div>
            
            <form onSubmit={handlePrescriptionSubmit}>
              {/* Disease/Diagnosis */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                  Disease/Diagnosis: *
                </label>
                <input
                  type="text"
                  value={prescriptionForm.disease}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, disease: e.target.value})}
                  required
                  placeholder="Enter disease or diagnosis"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Medicine Search */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>
                  Search Medicine: *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        searchMedicines(e.target.value);
                        setShowSearch(true);
                      } else {
                        setShowSearch(false);
                      }
                    }}
                    placeholder="Type medicine name (e.g., para, ibu)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '16px'
                    }}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearch && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1002
                    }}>
                      {searchResults.map(medicine => (
                        <div
                          key={medicine._id}
                          onClick={() => addMedicine(medicine)}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <strong>{medicine.name}</strong>
                          <br />
                          <small>
                            Price: ${medicine.price} | Stock: {medicine.quantity}
                            {medicine.quantity <= medicine.reorderThreshold && (
                              <span style={{ color: '#dc3545', fontWeight: 'bold' }}> (Low Stock!)</span>
                            )}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Medicines */}
              {prescriptionForm.medicines.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#333' }}>Selected Medicines:</h4>
                  {prescriptionForm.medicines.map((medicine, index) => (
                    <div key={index} style={{
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong>{medicine.medicineName}</strong>
                        <button
                          type="button"
                          onClick={() => removeMedicine(index)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '14px', color: '#666' }}>Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={medicine.quantity}
                            onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '14px', color: '#666' }}>Times per Day:</label>
                          <input
                            type="number"
                            min="1"
                            max="6"
                            value={medicine.frequency || 1}
                            onChange={(e) => updateMedicine(index, 'frequency', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '14px', color: '#666' }}>Instructions:</label>
                          <input
                            type="text"
                            value={medicine.instructions}
                            onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                            placeholder="e.g., After meals"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                        <div>Price: ${medicine.price} × {medicine.quantity} = ${medicine.total}</div>
                        <div style={{ marginTop: '5px', fontWeight: 'bold', color: '#007bff' }}>
                          Take {medicine.frequency || 1} time{(medicine.frequency || 1) > 1 ? 's' : ''} per day
                          {medicine.instructions && ` - ${medicine.instructions}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionForm(false)}
                  style={{
                    padding: '12px 24px',
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
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineTab;

