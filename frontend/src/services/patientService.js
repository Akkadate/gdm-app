import api from './api';

/**
 * Get all patients with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, search, risk_level, provider_id)
 * @returns {Promise<Object>} Patients data with pagination
 */
export const getPatients = async (params = {}) => {
  try {
    const response = await api.get('/patients', params);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch patients');
  }
};

/**
 * Get patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Patient data
 */
export const getPatient = async (id) => {
  try {
    const response = await api.get(`/patients/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch patient');
  }
};

/**
 * Create new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Created patient data
 */
export const createPatient = async (patientData) => {
  try {
    const response = await api.post('/patients', patientData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to create patient');
  }
};

/**
 * Update patient
 * @param {string} id - Patient ID
 * @param {Object} patientData - Patient data to update
 * @returns {Promise<Object>} Updated patient data
 */
export const updatePatient = async (id, patientData) => {
  try {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to update patient');
  }
};

/**
 * Delete patient
 * @param {string} id - Patient ID
 * @returns {Promise<void>}
 */
export const deletePatient = async (id) => {
  try {
    await api.delete(`/patients/${id}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to delete patient');
  }
};

/**
 * Calculate and update patient risk level
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Updated patient data with risk assessment
 */
export const calculateRisk = async (id) => {
  try {
    const response = await api.post(`/patients/${id}/calculate-risk`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to calculate risk');
  }
};

/**
 * Get risk distribution data
 * @returns {Promise<Object>} Risk distribution counts
 */
export const getRiskDistribution = async () => {
  try {
    const response = await api.get('/patients/risk-distribution');
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch risk distribution');
  }
};

export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  calculateRisk,
  getRiskDistribution
};