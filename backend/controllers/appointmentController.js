const appointmentModel = require('../models/appointmentModel');
const patientModel = require('../models/patientModel');
const { validationResult } = require('express-validator');

/**
 * Appointment Controller
 */
const appointmentController = {
  /**
   * Get all appointments with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAppointments(req, res, next) {
    try {
      // Parse query parameters
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      // Build filters
      const filters = {};
      if (req.query.date) filters.date = req.query.date;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.provider_id) filters.provider_id = req.query.provider_id;
      if (req.query.search) filters.search = req.query.search;
      
      // Get appointments and total count
      const appointments = await appointmentModel.findAll(filters, limit, offset);
      const total = await appointmentModel.count(filters);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      res.status(200).json({
        status: 'success',
        count: appointments.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single appointment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAppointment(req, res, next) {
    try {
      const appointment = await appointmentModel.findById(req.params.id);
      
      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get appointments for a specific patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatientAppointments(req, res, next) {
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
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      
      // Build filters
      const filters = { patient_id: patientId };
      if (req.query.status) filters.status = req.query.status;
      
      // Get appointments and total count
      const appointments = await appointmentModel.findByPatient(patientId, filters, limit, offset);
      const total = await appointmentModel.countByPatient(patientId, filters);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      res.status(200).json({
        status: 'success',
        count: appointments.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createAppointment(req, res, next) {
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
      
      // Create appointment
      const appointment = await appointmentModel.create(req.body, req.user.id);
      
      res.status(201).json({
        status: 'success',
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateAppointment(req, res, next) {
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
      
      // Check if appointment exists
      const appointmentExists = await appointmentModel.findById(req.params.id);
      if (!appointmentExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
      
      // If patient_id is being changed, check if the new patient exists
      if (req.body.patient_id && req.body.patient_id !== appointmentExists.patient_id) {
        const patient = await patientModel.findById(req.body.patient_id);
        if (!patient) {
          return res.status(404).json({
            status: 'error',
            message: 'Patient not found'
          });
        }
      }
      
      // Update appointment
      const appointment = await appointmentModel.update(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAppointment(req, res, next) {
    try {
      // Check if appointment exists
      const appointmentExists = await appointmentModel.findById(req.params.id);
      if (!appointmentExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
      
      // Delete appointment
      await appointmentModel.delete(req.params.id);
      
      res.status(200).json({
        status: 'success',
        message: 'Appointment deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get today's appointments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTodayAppointments(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Get appointments for today
      const appointments = await appointmentModel.findByDate(today);
      
      res.status(200).json({
        status: 'success',
        count: appointments.length,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update appointment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Status must be one of: scheduled, completed, cancelled, no-show'
        });
      }
      
      // Check if appointment exists
      const appointmentExists = await appointmentModel.findById(id);
      if (!appointmentExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
      
      // Update appointment status
      const appointment = await appointmentModel.update(id, { status });
      
      res.status(200).json({
        status: 'success',
        message: 'Appointment status updated successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = appointmentController;