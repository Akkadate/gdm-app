const patientModel = require('../models/patientModel');

/**
 * Patient Controller
 */
const patientController = {
  /**
   * Get all patients with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatients(req, res, next) {
    try {
      // Parse query parameters
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      // Build filters
      const filters = {};
      if (req.query.risk_level) filters.risk_level = req.query.risk_level;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.provider_id) filters.provider_id = req.query.provider_id;
      
      // Get patients and total count
      const patients = await patientModel.findAll(filters, limit, offset);
      const total = await patientModel.count(filters);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      res.status(200).json({
        status: 'success',
        count: patients.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: patients
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single patient by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatient(req, res, next) {
    try {
      const patient = await patientModel.findById(req.params.id);
      
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createPatient(req, res, next) {
    try {
      // Check if MRN already exists
      if (req.body.medical_record_number) {
        const existingPatient = await patientModel.findByMRN(req.body.medical_record_number);
        if (existingPatient) {
          return res.status(400).json({
            status: 'error',
            message: 'A patient with this medical record number already exists'
          });
        }
      }
      
      // Create patient
      const patient = await patientModel.create(req.body, req.user.id);
      
      res.status(201).json({
        status: 'success',
        message: 'Patient created successfully',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePatient(req, res, next) {
    try {
      // Check if patient exists
      const patientExists = await patientModel.findById(req.params.id);
      if (!patientExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Check if MRN is being changed and already exists
      if (req.body.medical_record_number && 
          req.body.medical_record_number !== patientExists.medical_record_number) {
        const existingPatient = await patientModel.findByMRN(req.body.medical_record_number);
        if (existingPatient) {
          return res.status(400).json({
            status: 'error',
            message: 'A patient with this medical record number already exists'
          });
        }
      }
      
      // Update patient
      const patient = await patientModel.update(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        message: 'Patient updated successfully',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deletePatient(req, res, next) {
    try {
      // Check if patient exists
      const patientExists = await patientModel.findById(req.params.id);
      if (!patientExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Delete patient
      await patientModel.delete(req.params.id);
      
      res.status(200).json({
        status: 'success',
        message: 'Patient deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Calculate and update patient risk level
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async calculateRisk(req, res, next) {
    try {
      // Check if patient exists
      const patientExists = await patientModel.findById(req.params.id);
      if (!patientExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Calculate risk and update patient
      const patient = await patientModel.calculateRisk(req.params.id);
      
      res.status(200).json({
        status: 'success',
        message: 'Risk assessment completed',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get risk distribution statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRiskDistribution(req, res, next) {
    try {
      const riskCounts = await patientModel.countByRiskLevel();
      
      res.status(200).json({
        status: 'success',
        data: riskCounts
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = patientController;
