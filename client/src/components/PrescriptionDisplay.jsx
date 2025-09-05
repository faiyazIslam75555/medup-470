import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

function PrescriptionDisplay({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        setError('Failed to fetch prescriptions');
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Network error while fetching prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ color: '#495057', marginBottom: '10px' }}>💊 No Prescriptions</h3>
        <p>You don't have any prescriptions yet.</p>
        <p>Your doctor will create prescriptions for you after appointments.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: '#007bff', marginBottom: '20px' }}>
        💊 My Prescriptions ({prescriptions.length})
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {prescriptions.map((prescription, index) => (
          <div key={prescription._id || index} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Prescription Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '15px',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '10px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                  Prescription #{prescription._id?.slice(-6) || index + 1}
                </h4>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                  {formatDate(prescription.createdAt)}
                </p>
              </div>
              <span style={{
                padding: '4px 8px',
                backgroundColor: getStatusColor(prescription.status),
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}>
                {prescription.status}
              </span>
            </div>

            {/* Disease/Diagnosis */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                <strong>Diagnosis:</strong>
              </p>
              <p style={{ margin: '0', color: '#333', fontSize: '16px' }}>
                {prescription.disease || 'N/A'}
              </p>
            </div>

            {/* Medicines */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                <strong>Medicines ({prescription.prescribedMedicines?.length || 0}):</strong>
              </p>
              {prescription.prescribedMedicines?.map((medicine, medIndex) => (
                <div key={medIndex} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#333' }}>{medicine.medicineName}</strong>
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                      ${medicine.total}
                    </span>
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Quantity:</strong> {medicine.quantity}
                    </p>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Price:</strong> ${medicine.price} each
                    </p>
                    {medicine.instructions && (
                      <p style={{ margin: '2px 0' }}>
                        <strong>Instructions:</strong> {medicine.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb',
              borderRadius: '4px',
              padding: '10px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', color: '#1976d2', fontSize: '16px', fontWeight: 'bold' }}>
                Total Amount: ${prescription.totalAmount || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrescriptionDisplay;



