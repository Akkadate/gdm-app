const glucoseReadingModel = require('../models/glucoseReadingModel');
const patientModel = require('../models/patientModel');
const { validationResult } = require('express-validator');
const config = require('../config/config');

/**
 * Glucose Reading Controller
 */
const glucoseController = {
  /**
   * Get all glucose readings with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReadings(req, res, next) {
    try {
      // Parse query parameters
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;
      
      // Build filters
      const filters = {};
      if (req.query.patient_id) filters.patient_id = req.query.patient_id;
      if (req.query.start_date) filters.start_date = req.query.start_date;
      if (req.query.end_date) filters.end_date = req.query.end_date;
      if (req.query.reading_type) filters.reading_type = req.query.reading_type;
      if (req.query.out_of_range !== undefined) {
        filters.out_of_range = req.query.out_of_range === 'true';
      }
      
      // Get readings and total count
      const readings = await glucoseReadingModel.findAll(filters, limit, offset);
      const total = await glucoseReadingModel.count(filters);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      res.status(200).json({
        status: 'success',
        count: readings.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: readings
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single glucose reading by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReading(req, res, next) {
    try {
      const reading = await glucoseReadingModel.findById(req.params.id);
      
      if (!reading) {
        return res.status(404).json({
          status: 'error',
          message: 'Glucose reading not found'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: reading
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get glucose readings for a specific patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatientReadings(req, res, next) {
    try {
      const { patientId } = req.params;
      
      // Check if patient exists
      const patient = await patientModel.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Parse query parameters
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;
      
      // Build filters
      const filters = {};
      if (req.query.start_date) filters.start_date = req.query.start_date;
      if (req.query.end_date) filters.end_date = req.query.end_date;
      if (req.query.reading_type) filters.reading_type = req.query.reading_type;
      if (req.query.out_of_range !== undefined) {
        filters.out_of_range = req.query.out_of_range === 'true';
      }
      
      // Get readings and total count
      const readings = await glucoseReadingModel.findByPatient(patientId, filters, limit, offset);
      const total = await glucoseReadingModel.countByPatient(patientId, filters);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      res.status(200).json({
        status: 'success',
        count: readings.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: readings
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new glucose reading
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createReading(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: errors.array()
        });
      }
      
      // Check if patient exists
      const patient = await patientModel.findById(req.body.patient_id);
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Create reading
      const reading = await glucoseReadingModel.create(req.body, req.user.id);
      
      // Check if reading is out of range and return threshold info
      let thresholdInfo = null;
      if (reading.out_of_range) {
        const readingType = reading.reading_type;
        const glucoseValue = reading.glucose_value;
        
        // Get thresholds for the reading type
        const thresholds = config.glucoseThresholds[readingType] || 
                          { low: 70, high: 180 }; // Default thresholds
        
        // Determine if reading is high or low
        const status = glucoseValue > thresholds.high ? 'high' : 
                      glucoseValue < thresholds.low ? 'low' : 'normal';
        
        thresholdInfo = {
          value: glucoseValue,
          thresholds,
          status
        };
      }
      
      res.status(201).json({
        status: 'success',
        message: 'Glucose reading created successfully',
        data: reading,
        threshold_info: thresholdInfo
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update glucose reading
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateReading(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: errors.array()
        });
      }
      
      // Check if reading exists
      const readingExists = await glucoseReadingModel.findById(req.params.id);
      if (!readingExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Glucose reading not found'
        });
      }
      
      // If patient_id is being changed, check if the new patient exists
      if (req.body.patient_id && req.body.patient_id !== readingExists.patient_id) {
        const patient = await patientModel.findById(req.body.patient_id);
        if (!patient) {
          return res.status(404).json({
            status: 'error',
            message: 'Patient not found'
          });
        }
      }
      
      // Update reading
      const reading = await glucoseReadingModel.update(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        message: 'Glucose reading updated successfully',
        data: reading
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete glucose reading
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteReading(req, res, next) {
    try {
      // Check if reading exists
      const readingExists = await glucoseReadingModel.findById(req.params.id);
      if (!readingExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Glucose reading not found'
        });
      }
      
      // Delete reading
      await glucoseReadingModel.delete(req.params.id);
      
      res.status(200).json({
        status: 'success',
        message: 'Glucose reading deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get glucose statistics for a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatientStats(req, res, next) {
    try {
      const { patientId } = req.params;
      
      // Check if patient exists
      const patient = await patientModel.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Get date range from query parameters
      const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
      
      // Get average glucose values by type
      const averages = await glucoseReadingModel.getAveragesByType(patientId, startDate, endDate);
      
      // Get daily averages
      const dailyAverages = await glucoseReadingModel.getDailyAverages(patientId, startDate, endDate);
      
      // Get compliance statistics
      const complianceStats = await glucoseReadingModel.getComplianceStats(patientId);
      
      res.status(200).json({
        status: 'success',
        data: {
          averages,
          dailyAverages,
          complianceStats,
          dateRange: {
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get out of range readings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getOutOfRangeReadings(req, res, next) {
    try {
      // Get days from query parameters (default: 7 days)
      const days = parseInt(req.query.days, 10) || 7;
      
      // Get limit from query parameters (default: 10)
      const limit = parseInt(req.query.limit, 10) || 10;
      
      // Get out of range readings
      const readings = await glucoseReadingModel.getRecentOutOfRange(days, limit);
      
      res.status(200).json({
        status: 'success',
        count: readings.length,
        data: readings
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk import glucose readings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async bulkImport(req, res, next) {
    try {
      const { patient_id, readings } = req.body;
      
      // Check if patient exists
      const patient = await patientModel.findById(patient_id);
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Validate readings array
      if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid readings array'
        });
      }
      
      // Import readings
      const importResults = await Promise.all(
        readings.map(async (reading) => {
          try {
            // Add patient_id to reading
            reading.patient_id = patient_id;
            
            // Create reading
            const createdReading = await glucoseReadingModel.create(reading, req.user.id);
            
            return {
              status: 'success',
              reading: createdReading
            };
          } catch (error) {
            return {
              status: 'error',
              reading: reading,
              error: error.message
            };
          }
        })
      );
      
      // Count successful and failed imports
      const successCount = importResults.filter(result => result.status === 'success').length;
      const failedCount = importResults.length - successCount;
      
      res.status(200).json({
        status: 'success',
        message: `Imported ${successCount} readings (${failedCount} failed)`,
        data: {
          total: importResults.length,
          success: successCount,
          failed: failedCount,
          results: importResults
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = glucoseController;