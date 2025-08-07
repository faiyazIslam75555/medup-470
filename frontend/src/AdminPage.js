import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

const AdminPage = () => {
  const [staff, setStaff] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'doctor', // doctor, nurse, receptionist, admin
    specialty: '',
    experience_years: '',
    department: '',
    qualification: '',
    license_number: '',
    hire_date: '',
    salary: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStaff();
    fetchSpecialties();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/staff');
      if (response.data.success) {
        setStaff(response.data.staff || []);
        setError(null);
      } else {
        setError('Failed to load staff data. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/specialties');
      if (response.data.success) {
        setSpecialties(response.data.specialties || []);
      } else {
        console.error('Failed to fetch specialties');
      }
    } catch (err) {
      console.error('Error fetching specialties:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'doctor',
      specialty: '',
      experience_years: '',
      department: '',
      qualification: '',
      license_number: '',
      hire_date: '',
      salary: '',
      status: 'active'
    });
    setEditingStaff(null);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/admin/staff', formData);
      if (response.data.success) {
        setStaff(prev => [...prev, response.data.staff]);
        setShowAddForm(false);
        resetForm();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to add staff member. Please try again.');
      }
    } catch (err) {
      console.error('Error adding staff:', err);
      setError(err.response?.data?.error || 'Failed to add staff member. Please try again.');
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3000/api/admin/staff/${editingStaff._id}`, formData);
      if (response.data.success) {
        setStaff(prev => prev.map(s => s._id === editingStaff._id ? response.data.staff : s));
        setEditingStaff(null);
        resetForm();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update staff member. Please try again.');
      }
    } catch (err) {
      console.error('Error updating staff:', err);
      setError(err.response?.data?.error || 'Failed to update staff member. Please try again.');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await axios.delete(`http://localhost:3000/api/admin/staff/${staffId}`);
        if (response.data.success) {
          setStaff(prev => prev.filter(s => s._id !== staffId));
          setError(null);
        } else {
          setError(response.data.error || 'Failed to delete staff member. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting staff:', err);
        setError(err.response?.data?.error || 'Failed to delete staff member. Please try again.');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      specialty: staffMember.specialty || '',
      experience_years: staffMember.experience_years || '',
      department: staffMember.department,
      qualification: staffMember.qualification,
      license_number: staffMember.license_number || '',
      hire_date: staffMember.hire_date,
      salary: staffMember.salary,
      status: staffMember.status
    });
  };

  const filteredStaff = staff.filter(member => {
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      case 'receptionist': return '👩‍💼';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'on_leave': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Staff Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + Add New Staff
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search staff by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="nurse">Nurses</option>
            <option value="receptionist">Receptionists</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="staff-grid">
        {filteredStaff.map((member) => (
          <div key={member._id} className="staff-card">
            <div className="staff-header">
              <div className="staff-avatar">
                {getRoleIcon(member.role)}
              </div>
              <div className="staff-info">
                <h3 className="staff-name">{member.name}</h3>
                <p className="staff-role">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</p>
                <span className={`status-badge status-${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              <div className="staff-actions">
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEdit(member)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteStaff(member._id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="staff-details">
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{member.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{member.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{member.department}</span>
              </div>
              {member.specialty && (
                <div className="detail-row">
                  <span className="detail-label">Specialty:</span>
                  <span className="detail-value">{member.specialty}</span>
                </div>
              )}
              {member.experience_years && (
                <div className="detail-row">
                  <span className="detail-label">Experience:</span>
                  <span className="detail-value">{member.experience_years} years</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Qualification:</span>
                <span className="detail-value">{member.qualification}</span>
              </div>
              {member.license_number && (
                <div className="detail-row">
                  <span className="detail-label">License:</span>
                  <span className="detail-value">{member.license_number}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Hire Date:</span>
                <span className="detail-value">{new Date(member.hire_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Salary:</span>
                <span className="detail-value">${member.salary?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Staff Modal */}
      {(showAddForm || editingStaff) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {formData.role === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label>Specialty *</label>
                      <select
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Specialty</option>
                        {specialties.map(spec => (
                          <option key={spec._id} value={spec.name}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Experience (Years)</label>
                      <input
                        type="number"
                        name="experience_years"
                        value={formData.experience_years}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>License Number</label>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Qualification *</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hire Date *</label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
