import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function MyInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'credit_card',
    amount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInvoices();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/invoices/my-invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        console.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${selectedInvoice._id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Payment processed successfully!');
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        fetchInvoices(); // Refresh invoices
      } else {
        setMessage(data.message || 'Payment failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      paymentMethod: 'credit_card',
      amount: invoice.totalAmount
    });
    setShowPaymentModal(true);
    setMessage('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'white'
      }}>
        <div>Loading invoices...</div>
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
        maxWidth: '1200px',
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
            💰 My Invoices
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

        {message && (
      <div style={{ 
            marginBottom: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
            color: message.includes('successfully') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        {invoices.length === 0 ? (
        <div style={{ 
          textAlign: 'center',
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
          borderRadius: '8px', 
            border: '1px solid #e9ecef'
          }}>
            <p style={{ margin: 0, fontSize: '18px' }}>No invoices found.</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
              Your invoices will appear here when prescriptions are created.
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Invoice #</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Due Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td style={{ padding: '12px' }}>{invoice.invoiceNumber}</td>
                    <td style={{ padding: '12px' }}>{formatDate(invoice.issueDate)}</td>
                    <td style={{ padding: '12px' }}>{formatDate(invoice.dueDate)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(invoice.totalAmount)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(invoice.status),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Pay Now
                        </button>
                      )}
                      {invoice.status === 'paid' && invoice.paidDate && (
                        <span style={{ fontSize: '12px', color: '#28a745' }}>
                          Paid on {formatDate(invoice.paidDate)}
        </span>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6f42c1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginLeft: '5px'
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      </div>
        )}

        {/* Invoice Details Modal */}
        {selectedInvoice && !showPaymentModal && (
            <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', 
            justifyContent: 'center',
              alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Invoice Details</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <strong>Status:</strong> 
              <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: getStatusColor(selectedInvoice.status),
                  color: 'white',
                fontSize: '12px',
                  fontWeight: 'bold'
              }}>
                  {getStatusText(selectedInvoice.status)}
              </span>
            </div>

              {/* Invoice Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h4>Invoice Breakdown</h4>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Tax (10%):</span>
                    <span>{formatCurrency(selectedInvoice.tax || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Hospital Fee (10%):</span>
                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.hospitalFee || 0)}</span>
                  </div>
                  <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
            </div>
            </div>

              {/* Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Items</h4>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                      borderRadius: '4px', 
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px',
                        paddingBottom: '8px',
                        borderBottom: index < selectedInvoice.items.length - 1 ? '1px solid #dee2e6' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{item.medicineName}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>
                          {formatCurrency(item.total)}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                {selectedInvoice.status === 'pending' && (
                <button
                    onClick={() => {
                      setShowPaymentModal(true);
                      setPaymentData({
                        paymentMethod: 'credit_card',
                        amount: selectedInvoice.totalAmount
                      });
                    }}
                  style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                      cursor: 'pointer'
                  }}
                >
                    Pay Now
                </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Process Payment</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <strong>Invoice:</strong> {selectedInvoice.invoiceNumber}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Amount to Pay
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                  min="0"
                  max={selectedInvoice.totalAmount}
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <strong>Note:</strong> This is a mock payment system for demonstration purposes. 
                No real payment will be processed.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
      </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default MyInvoicesPage;