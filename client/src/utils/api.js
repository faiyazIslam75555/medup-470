// utils/api.js
// API configuration for connecting to backend

export const API_BASE_URL = 'http://localhost:5000';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};

// Helper function for authenticated API calls
export const authenticatedApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  };

  return apiCall(endpoint, authOptions);
};