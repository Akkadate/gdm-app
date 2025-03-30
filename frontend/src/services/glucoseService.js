import api from './api';

/**
 * Get all glucose readings with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, patient_id, start_date, end_date, reading_type, out_of_range)
 * @returns {Promise<Object>} Readings data with pagination
 */
export const getReadings = async (params = {}) => {
  try {
    const response = await api.get('/glucose', params);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch glucose readings');
  }
};

/**
 * Get glucose reading by ID
 * @param {string} id - Reading ID
 * @returns {Promise<Object>} Reading data
 */
export const getReading = async (id) => {
  try {
    const response = await api.get(`/glucose/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch glucose reading');
  }
};

/**
 * Get glucose readings for a specific patient
 * @param {string} patientId - Patient ID
 * @param {Object} params - Query parameters (page, limit, start_date, end_date, reading_type, out_of_range)
 * @returns {Promise<Object>} Readings data with pagination
 */
export const getPatientReadings = async (patientId, params = {}) => {
  try {
    const response = await api.get(`/glucose/patient/${patientId}`, params);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch patient glucose readings');
  }
};

/**
 * Create new glucose reading
 * @param {Object} readingData - Glucose reading data
 * @returns {Promise<Object>} Created reading data
 */
export const createReading = async (readingData) => {
  try {
    const response = await api.post('/glucose', readingData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to create glucose reading');
  }
};

/**
 * Update glucose reading
 * @param {string} id - Reading ID
 * @param {Object} readingData - Reading data to update
 * @returns {Promise<Object>} Updated reading data
 */
export const updateReading = async (id, readingData) => {
  try {
    const response = await api.put(`/glucose/${id}`, readingData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to update glucose reading');
  }
};

/**
 * Delete glucose reading
 * @param {string} id - Reading ID
 * @returns {Promise<void>}
 */
export const deleteReading = async (id) => {
  try {
    await api.delete(`/glucose/${id}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to delete glucose reading');
  }
};

/**
 * Get glucose statistics for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} params - Query parameters (start_date, end_date)
 * @returns {Promise<Object>} Glucose statistics data
 */
export const getPatientStats = async (patientId, params = {}) => {
  try {
    const response = await api.get(`/glucose/patient/${patientId}/stats`, params);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch glucose statistics');
  }
};

/**
 * Get out of range readings
 * @param {Object} params - Query parameters (days, limit)
 * @returns {Promise<Array>} List of out of range readings
 */
export const getOutOfRangeReadings = async (params = {}) => {
  try {
    const response = await api.get('/glucose/out-of-range', params);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch out of range readings');
  }
};

/**
 * Bulk import glucose readings
 * @param {string} patientId - Patient ID
 * @param {Array} readings - Array of glucose reading data
 * @returns {Promise<Object>} Import results
 */
export const bulkImport = async (patientId, readings) => {
  try {
    const response = await api.post('/glucose/bulk-import', {
      patient_id: patientId,
      readings
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to import glucose readings');
  }
};

export default {
  getReadings,
  getReading,
  getPatientReadings,
  createReading,
  updateReading,
  deleteReading,
  getPatientStats,
  getOutOfRangeReadings,
  bulkImport
};