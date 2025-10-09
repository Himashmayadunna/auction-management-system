// lib/api.js - API Configuration and Integration

// API Base URL - Update this with your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API endpoints
const ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  HEALTH: '/auth/health',
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  let data;
  
  try {
    data = await response.json();
  } catch (jsonError) {
    // Handle cases where response is not JSON
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }
  
  if (!response.ok) {
    // Enhanced error handling for 400 Bad Request
    console.error('API Error Response:', data);
    
    if (response.status === 400) {
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => 
          typeof err === 'string' ? err : err.message || JSON.stringify(err)
        ).join('; ');
        throw new Error(`Validation Error: ${errorMessages}`);
      } else if (data.title && data.errors) {
        // ASP.NET Core validation format
        const validationErrors = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`Validation Error: ${validationErrors}`);
      }
    }
    
    // Handle error responses from backend
    const error = data.message || data.errors?.[0] || `Server error: ${response.status}`;
    throw new Error(error);
  }
  
  return data;
};

// Test backend connection
export const testConnection = async () => {
  console.log('Testing connection to:', `${API_BASE_URL}/health`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      return true;
    } else {
      console.log('❌ Backend responded with error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('Common causes:');
    console.log('1. Backend not running on the specified port');
    console.log('2. CORS not configured for your frontend URL');
    console.log('3. HTTPS certificate issues (try HTTP instead)');
    return false;
  }
};

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      console.log('Attempting to register with URL:', `${API_BASE_URL}${ENDPOINTS.REGISTER}`);
      console.log('User data:', userData);
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await handleResponse(response);
      return result.data; // Return the data object containing user info and token
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        throw new Error('Cannot connect to server. This could be due to:\n1. Backend not running on port 7188\n2. CORS not configured for http://localhost:3000\n3. HTTPS certificate issues\n\nTry switching to HTTP in .env.local if using HTTPS.');
      } else if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        throw new Error('CORS error. Please ensure your backend allows requests from http://localhost:3000');
      }
      
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const result = await handleResponse(response);
      return result.data; // Return the data object containing user info and token
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.HEALTH}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },
};

// Storage helper functions
export const setAuthData = (authData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify({
      userId: authData.userId,
      firstName: authData.firstName,
      lastName: authData.lastName,
      email: authData.email,
      accountType: authData.accountType,
    }));
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};