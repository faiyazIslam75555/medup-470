import React, { useState } from 'react';
import EmergencyUnlockModal from './EmergencyUnlockModal.jsx';

function EmergencyUnlockButton({ patientId, userRole, onEmergencyAccessGranted }) {
  const [showModal, setShowModal] = useState(false);

  // Only show button for doctors and admins
  if (userRole !== 'doctor' && userRole !== 'admin') {
    return null;
  }

  const handleEmergencyAccess = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSuccess = (data) => {
    if (onEmergencyAccessGranted) {
      onEmergencyAccessGranted(data);
    }
  };

  return (
    <>
      <button
        onClick={handleEmergencyAccess}
        style={{
          padding: '10px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
          transition: 'all 0.2s ease',
          marginLeft: '10px'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#c82333';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#dc3545';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.3)';
        }}
        title="Grant emergency access to patient's complete EMR (requires password verification)"
      >
        🚨 Emergency Unlock
      </button>

      <EmergencyUnlockModal
        isOpen={showModal}
        onClose={handleModalClose}
        patientId={patientId}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default EmergencyUnlockButton;









