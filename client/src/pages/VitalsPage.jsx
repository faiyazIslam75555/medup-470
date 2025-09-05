import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function VitalsPage() {
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: '',
    weight: '',
    notes: ''
  });
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchVitalsHistory();
  }, [navigate]);

  const fetchVitalsHistory = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      if (!userData || !userData._id) {
        console.error('User data not found or missing ID');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/vitals/patient/${userData._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVitalsHistory(data.vitals || []);
      } else if (response.status === 403) {
        console.log('Access forbidden - user may not have permission');
        setVitalsHistory([]);
      } else {
        console.error('Failed to fetch vitals:', response.status);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
      setVitalsHistory([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vitals)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Vitals recorded successfully! Redirecting to dashboard...');
        setVitals({
          bloodPressure: { systolic: '', diastolic: '' },
          heartRate: '',
          temperature: '',
          weight: '',
          notes: ''
        });
        
        fetchVitalsHistory();
        
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to record vitals');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'systolic' || field === 'diastolic') {
      setVitals(prev => ({
        ...prev,
        bloodPressure: {
          ...prev.bloodPressure,
          [field]: value
        }
      }));
    } else {
      setVitals(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>
            💓 Patient Vitals Management
          </h1>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/patient-dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ 
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3>Record Your Vitals</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Blood Pressure</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Systolic"
                  value={vitals.bloodPressure.systolic}
                  onChange={(e) => handleInputChange('systolic', e.target.value)}
                  required
                  min="50"
                  max="300"
                  style={{
                    width: '100px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <span>/</span>
                <input
                  type="number"
                  placeholder="Diastolic"
                  value={vitals.bloodPressure.diastolic}
                  onChange={(e) => handleInputChange('diastolic', e.target.value)}
                  required
                  min="30"
                  max="200"
                  style={{
                    width: '100px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Heart Rate (bpm)</label>
              <input
                type="number"
                placeholder="e.g., 72"
                value={vitals.heartRate}
                onChange={(e) => handleInputChange('heartRate', e.target.value)}
                required
                min="30"
                max="200"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Temperature (°F)</label>
              <input
                type="number"
                placeholder="e.g., 98.6"
                value={vitals.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                required
                min="30"
                max="45"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Weight (lbs)</label>
              <input
                type="number"
                placeholder="e.g., 150"
                value={vitals.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                required
                min="0"
                max="500"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Notes (optional)</label>
              <textarea
                placeholder="How are you feeling today?"
                value={vitals.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                maxLength="200"
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            {message && (
              <div style={{ 
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
                color: message.includes('successfully') ? '#155724' : '#721c24',
                border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Recording...' : 'Record Vitals'}
            </button>
          </form>
        </div>

        <div>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>📊 Your Vitals History</h3>
          
          {vitalsHistory.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: 0 }}>No vitals recorded yet.</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
                Use the form above to record your first vitals.
              </p>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Blood Pressure</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Heart Rate</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Temperature</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Weight</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {vitalsHistory.map((vital, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(vital.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}
                      </td>
                      <td style={{ padding: '12px' }}>{vital.heartRate} bpm</td>
                      <td style={{ padding: '12px' }}>{vital.temperature}°F</td>
                      <td style={{ padding: '12px' }}>{vital.weight} lbs</td>
                      <td style={{ padding: '12px' }}>{vital.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VitalsPage;
