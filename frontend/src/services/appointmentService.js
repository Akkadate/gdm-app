import api from './api';

/**
 * Get all appointments with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, date, status, provider_id, search)
 * @returns {Promise<Object>} Appointments data with pagination
 */
export const getAppointments = async (params = {}) => {
  try {
    const response = await api.get('/appointments', params);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch appointments');
  }
};

/**
 * Get appointment by ID
 * @param {string} id - Appointment ID
 * @returns {Promise<Object>} Appointment data
 */
export const getAppointment = async (id) => {
  try {
    const response = await api.get(`/appointments/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch appointment');
  }
};

/**
 * Get appointments for a specific patient
 * @param {string} patientId - Patient ID
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise<Object>} Appointments data with pagination
 */
export const getPatientAppointments = async (patientId, params = {}) => {
  try {
    const response = await api.get(`/appointments/patient/${patientId}`, params);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch patient appointments');
  }
};

/**
 * Create new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment data
 */
export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments', appointmentData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to create appointment');
  }
};

/**
 * Update appointment
 * @param {string} id - Appointment ID
 * @param {Object} appointmentData - Appointment data to update
 * @returns {Promise<Object>} Updated appointment data
 */
export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to update appointment');
  }
};

/**
 * Delete appointment
 * @param {string} id - Appointment ID
 * @returns {Promise<void>}
 */
export const deleteAppointment = async (id) => {
  try {
    await api.delete(`/appointments/${id}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to delete appointment');
  }
};

/**
 * Update appointment status
 * @param {string} id - Appointment ID
 * @param {string} status - New status ('scheduled', 'completed', 'cancelled', 'no-show')
 * @returns {Promise<Object>} Updated appointment data
 */
export const updateStatus = async (id, status) => {
  try {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to update appointment status');
  }
};

/**
 * Get today's appointments
 * @returns {Promise<Array>} List of today's appointments
 */
export const getTodayAppointments = async () => {
  try {
    const response = await api.get('/appointments/today');
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch today\'s appointments');
  }
};

export default {
  getAppointments,
  getAppointment,
  getPatientAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateStatus,
  getTodayAppointments
};