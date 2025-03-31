import { apiClient } from './api';

/**
 * Service for handling user-related API operations
 * Users = medical staff (doctors, nurses, admins), not patients
 */

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all users
export const getAllUsers = async (filters = {}) => {
  try {
    const response = await apiClient.get('/api/users', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/api/users', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update current user profile
export const updateProfile = async (userData) => {
  try {
    const response = await apiClient.put('/api/users/me', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await apiClient.put('/api/users/password', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user roles
export const getUserRoles = async () => {
  try {
    const response = await apiClient.get('/api/users/roles');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get doctors (filtered user list for doctors only)
export const getDoctors = async () => {
  try {
    const response = await apiClient.get('/api/users', { params: { role: 'doctor' } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get nurses (filtered user list for nurses only)
export const getNurses = async () => {
  try {
    const response = await apiClient.get('/api/users', { params: { role: 'nurse' } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reset user password (admin function)
export const resetUserPassword = async (userId) => {
  try {
    const response = await apiClient.post(`/api/users/${userId}/reset-password`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user activity logs
export const getUserActivityLogs = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}/logs`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getCurrentUser,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  updateProfile,
  changePassword,
  deleteUser,
  getUserRoles,
  getDoctors,
  getNurses,
  resetUserPassword,
  getUserActivityLogs
};