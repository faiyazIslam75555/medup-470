import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

function EmergencyUnlockModal({ isOpen, onClose, patientId, onSuccess }) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim() || !password.trim()) {
      setError('Please provide both reason and password');
      return;
    }

    // If no patientId, show a message that this is for general emergency access
    if (!patientId) {
      setError('Emergency access requires a specific patient. Please access this feature from a patient\'s EMR page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/emergency/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          reason: reason.trim(),
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Clear form
        setReason('');
        setPassword('');
        setError('');
        
        // Show success message
        alert(`🚨 Emergency Access Granted!\n\nPatient: ${data.accessLog.patientName}\nReason: ${data.accessLog.reason}\nDuration: ${data.accessLog.duration} minutes\n\n${data.warning}`);
        
        // Close modal and trigger success callback
        onClose();
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.message || 'Failed to grant emergency access');
      }
    } catch (error) {
      console.error('Emergency access error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #dc3545'
        }}>
          <div style={{
            fontSize: '24px',
            marginRight: '10px'
          }}>🚨</div>
          <h2 style={{
            margin: 0,
            color: '#dc3545',
            fontSize: '20px'
          }}>
            Emergency Access Unlock
          </h2>
        </div>

        {/* Warning */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong>⚠️ WARNING:</strong> This action will grant you immediate access to the patient's complete medical records. 
          All emergency access is permanently logged and monitored by administrators.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333'
            }}>
              Reason for Emergency Access *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Patient in cardiac arrest, unconscious patient, severe allergic reaction..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333'
            }}>
              Re-enter Your Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              color: '#721c24',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Granting Access...' : '🚨 Grant Emergency Access'}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div style={{
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          Emergency access expires after 2 hours and is automatically logged for audit purposes.
        </div>
      </div>
    </div>
  );
}

export default EmergencyUnlockModal;
