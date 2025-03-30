import api from './api';

/**
 * User login
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} User data
 */
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    
    // Store token in localStorage
    localStorage.setItem('token', response.data.token);
    
    return response.data.user;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * User logout
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
};

/**
 * Refresh authentication token
 * @returns {Promise<string>} New token
 */
export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh-token');
    
    // Update token in localStorage
    localStorage.setItem('token', response.data.token);
    
    return response.data.token;
  } catch (error) {
    throw new Error(error.message || 'Token refresh failed');
  }
};

/**
 * Get current user data
 * @returns {Promise<Object>} User data
 */
export const getUser = async () => {
  try {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to get user data');
  }
};

/**
 * Register new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user data
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Updated user data
 */
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/update-password', {
      currentPassword,
      newPassword
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Password update failed');
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Authentication status
 */
export const isAuthenticated = async () => {
  try {
    const user = await getUser();
    return !!user;
  } catch (error) {
    return false;
  }
};