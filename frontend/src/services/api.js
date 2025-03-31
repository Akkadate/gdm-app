import axios from 'axios';

// Get base URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://api.gdm.devapp.cc';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark as retrying to prevent infinite loop
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          // Update tokens in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Create error object with additional information
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = error.response?.status;
    enhancedError.errors = error.response?.data?.errors || [];
    enhancedError.originalError = error;
    
    return Promise.reject(enhancedError);
  }
);

// Helper methods

/**
 * Make GET request
 * @param {string} url - API endpoint
 * @param {Object} params - Query parameters
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
const get = (url, params = {}, config = {}) => {
  return api.get(url, { params, ...config });
};

/**
 * Make POST request
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
const post = (url, data = {}, config = {}) => {
  return api.post(url, data, config);
};

/**
 * Make PUT request
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
const put = (url, data = {}, config = {}) => {
  return api.put(url, data, config);
};

/**
 * Make DELETE request
 * @param {string} url - API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
const remove = (url, config = {}) => {
  return api.delete(url, config);
};

// Export api and helper methods
export default {
  api,
  get,
  post,
  put,
  delete: remove
};