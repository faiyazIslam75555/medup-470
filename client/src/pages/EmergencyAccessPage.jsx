import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencyUnlockModal from '../components/EmergencyUnlockModal.jsx';
import { API_BASE_URL } from '../utils/api.js';

function EmergencyAccessPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [searchType, setSearchType] = useState('id'); // 'id' or 'name'
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchPatients = async () => {
    if (searchType === 'name' && !patientName.trim()) {
      setError('Please enter a patient name');
      return;
    }
    if (searchType === 'id' && !patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/users/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        let results = [];

        if (searchType === 'name') {
          results = users.filter(user => 
            user.name && user.name.toLowerCase().includes(patientName.toLowerCase())
          );
        } else {
          results = users.filter(user => 
            user._id === patientId || user.email === patientId
          );
        }

        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setError('Failed to search patients');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Network error. Please try again.');
    }
  };

  const selectPatient = (patient) => {
    setPatientId(patient._id);
    setPatientName(patient.name);
    setShowSearchResults(false);
    setError('');
  };

  const handleEmergencyAccess = () => {
    if (!patientId.trim()) {
      setError('Please select a patient first');
      return;
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setError('');
  };

  const handleSuccess = (data) => {
    console.log('Emergency access granted:', data);
    setShowModal(false);
    // Show success message
    alert(`🚨 Emergency Access Granted!\n\nPatient: ${data.accessLog.patientName}\nReason: ${data.accessLog.reason}\nDuration: ${data.accessLog.duration} minutes\n\n${data.warning}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #eee',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>🚨 Emergency Access</h1>
            <p style={{ color: '#666', margin: 0 }}>Override standard permissions for critical patient care</p>
          </div>
          
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Warning Box */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>⚠️ Important Notice</h3>
          <p style={{ color: '#856404', margin: '0 0 10px 0' }}>
            This feature allows authorized personnel to override standard patient access restrictions in emergency situations.
          </p>
          <p style={{ color: '#856404', margin: '0', fontWeight: 'bold' }}>
            All emergency access events are permanently logged and monitored by administrators.
          </p>
        </div>

        {/* Search Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Search by:
          </label>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="searchType"
                value="id"
                checked={searchType === 'id'}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setError('');
                }}
                style={{ marginRight: '8px' }}
              />
              Patient ID
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="searchType"
                value="name"
                checked={searchType === 'name'}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setError('');
                }}
                style={{ marginRight: '8px' }}
              />
              Patient Name
            </label>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            {searchType === 'id' ? 'Patient ID:' : 'Patient Name:'}
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchType === 'id' ? patientId : patientName}
              onChange={(e) => {
                if (searchType === 'id') {
                  setPatientId(e.target.value);
                } else {
                  setPatientName(e.target.value);
                }
                setError('');
              }}
              placeholder={searchType === 'id' ? 'Enter patient ID (e.g., patient10)' : 'Enter patient name (e.g., John Doe)'}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={searchPatients}
              style={{
                padding: '12px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔍 Search
            </button>
          </div>
          {error && (
            <p style={{ color: '#dc3545', margin: '5px 0 0 0', fontSize: '14px' }}>
              {error}
            </p>
          )}
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>Search Results:</h4>
            {searchResults.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No patients found</p>
            ) : (
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                maxHeight: '200px', 
                overflowY: 'auto' 
              }}>
                {searchResults.map((patient, index) => (
                  <div
                    key={index}
                    onClick={() => selectPatient(patient)}
                    style={{
                      padding: '10px 15px',
                      borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer',
                      backgroundColor: '#f8f9fa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {patient.name || 'Unknown Name'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      ID: {patient._id} | Email: {patient.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Patient */}
        {patientId && patientName && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb', 
            borderRadius: '5px' 
          }}>
            <h4 style={{ color: '#155724', margin: '0 0 5px 0' }}>Selected Patient:</h4>
            <p style={{ color: '#155724', margin: '0' }}>
              <strong>{patientName}</strong> (ID: {patientId})
            </p>
          </div>
        )}

        {/* Emergency Access Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleEmergencyAccess}
            style={{
              padding: '15px 30px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#c82333';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(220, 53, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
            }}
          >
            🚨 Grant Emergency Access
          </button>
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ color: '#333', margin: '0 0 15px 0' }}>How to Use:</h4>
          <ol style={{ color: '#666', margin: '0', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Choose to search by Patient ID or Patient Name</li>
            <li style={{ marginBottom: '8px' }}>Enter the patient information and click "Search"</li>
            <li style={{ marginBottom: '8px' }}>Select the correct patient from search results</li>
            <li style={{ marginBottom: '8px' }}>Click "Grant Emergency Access"</li>
            <li style={{ marginBottom: '8px' }}>Provide a valid reason for emergency access</li>
            <li style={{ marginBottom: '8px' }}>Enter your account password for verification</li>
            <li style={{ marginBottom: '8px' }}>Access will be granted for a limited time</li>
            <li>All actions are logged and monitored</li>
          </ol>
        </div>
      </div>

      {/* Emergency Unlock Modal */}
      <EmergencyUnlockModal
        isOpen={showModal}
        onClose={handleModalClose}
        patientId={patientId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default EmergencyAccessPage;
