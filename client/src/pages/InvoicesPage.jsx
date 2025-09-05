// pages/InvoicesPage.jsx
// Enhanced Invoices page with proper field mapping and better display

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      case 'cancelled': return '#6c757d';
      case 'partial': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>📋 Invoices - mediCore</h1>
      
      {/* Filter Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold', color: '#555' }}>Filter by Status:</label>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Invoices</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="partial">Partial</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span style={{ color: '#666' }}>
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </span>
      </div>

      {/* Invoices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredInvoices.map((invoice, index) => (
          <div key={index} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Invoice Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Invoice #{invoice.invoiceNumber}</h3>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: getStatusColor(invoice.status)
              }}>
                {invoice.status.toUpperCase()}
              </span>
            </div>

            {/* Invoice Details */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Patient:</strong> {invoice.patient?.name || 'N/A'}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Disease:</strong> {invoice.prescription?.disease || 'N/A'}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Doctor:</strong> {invoice.prescription?.doctor?.name || 'N/A'}
              </p>
            </div>

            {/* Financial Details */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '6px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Subtotal:</strong> ${invoice.subtotal?.toFixed(2) || '0.00'}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Tax (10%):</strong> ${invoice.tax?.toFixed(2) || '0.00'}
              </p>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                <strong>Total Amount:</strong> ${invoice.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>

            {/* Dates */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
              {invoice.paidDate && (
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Paid Date:</strong> {new Date(invoice.paidDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Medicine Items */}
            {invoice.items && invoice.items.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>📦 Prescribed Medicines:</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {invoice.items.map((item, idx) => (
                    <div key={idx} style={{ 
                      padding: '8px', 
                      backgroundColor: '#fff', 
                      borderRadius: '4px', 
                      marginBottom: '5px',
                      border: '1px solid #eee'
                    }}>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                        <strong>{item.medicineName}</strong> - Qty: {item.quantity} × ${item.unitPrice} = ${item.total}
                      </p>
                      <p style={{ margin: '2px 0', fontSize: '11px', color: getStatusColor(item.availability) }}>
                        Status: {item.availability} {item.availability === 'partial' && `(${item.availableQuantity} available)`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No invoices found for the selected status.</p>
        </div>
      )}
    </div>
  );
}

export default InvoicesPage;
