import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function EmergencyAccessLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    doctorId: '',
    patientId: '',
    page: 1
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLogs();
  }, [navigate, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.doctorId) queryParams.append('doctorId', filters.doctorId);
      if (filters.patientId) queryParams.append('patientId', filters.patientId);
      if (filters.page) queryParams.append('page', filters.page);

      const response = await fetch(`${API_BASE_URL}/api/emergency/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || {});
        setStatistics(data.statistics || {});
        setError('');
      } else {
        setError('Failed to fetch emergency access logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted': return '#28a745';
      case 'denied': return '#dc3545';
      case 'expired': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      case 'expired': return '⏰';
      default: return '❓';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
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
        <div>Loading emergency access logs...</div>
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
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: '#333', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚨 Emergency Access Audit Logs
          </h1>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/admin-dashboard')}
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

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {statistics.totalAccesses || 0}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Total Emergency Accesses</div>
          </div>
          <div style={{
            backgroundColor: '#d4edda',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #c3e6cb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
              {statistics.grantedAccesses || 0}
            </div>
            <div style={{ color: '#155724', fontSize: '14px' }}>Granted Accesses</div>
          </div>
          <div style={{
            backgroundColor: '#f8d7da',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
              {statistics.deniedAccesses || 0}
            </div>
            <div style={{ color: '#721c24', fontSize: '14px' }}>Denied Accesses</div>
          </div>
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
              {statistics.expiredAccesses || 0}
            </div>
            <div style={{ color: '#856404', fontSize: '14px' }}>Expired Accesses</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Filters</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">All Statuses</option>
                <option value="granted">Granted</option>
                <option value="denied">Denied</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Doctor ID</label>
              <input
                type="text"
                value={filters.doctorId}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                placeholder="Enter doctor ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Patient ID</label>
              <input
                type="text"
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
                placeholder="Enter patient ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginBottom: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div style={{ 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Doctor</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Patient</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Reason</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Accessed At</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666',
                    backgroundColor: '#f8f9fa'
                  }}>
                    No emergency access logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500' }}>
                        {log.doctor?.user?.name || 'Unknown Doctor'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {log.doctor?.user?.email || 'No email'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500' }}>
                        {log.patient?.name || 'Unknown Patient'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {log.patient?.email || 'No email'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '200px' }}>
                      <div style={{ 
                        fontSize: '14px',
                        wordBreak: 'break-word'
                      }}>
                        {log.reason}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(log.status),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getStatusIcon(log.status)} {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {formatDate(log.accessedAt)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {log.duration ? `${log.duration} min` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={!pagination.hasPrev}
              style={{
                padding: '8px 16px',
                backgroundColor: pagination.hasPrev ? '#6f42c1' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pagination.hasPrev ? 'pointer' : 'not-allowed'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '0 10px' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={!pagination.hasNext}
              style={{
                padding: '8px 16px',
                backgroundColor: pagination.hasNext ? '#6f42c1' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pagination.hasNext ? 'pointer' : 'not-allowed'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmergencyAccessLogsPage;









