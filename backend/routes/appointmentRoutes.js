const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { validateAppointment, validateIdParam, validatePagination, validateDateRange, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments with pagination and filtering
 * @access  Private
 */
router.get('/', validatePagination, validateDateRange, handleValidationErrors, appointmentController.getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment by ID
 * @access  Private
 */
router.get('/:id', validateIdParam, handleValidationErrors, appointmentController.getAppointment);

/**
 * @route   GET /api/appointments/patient/:patientId
 * @desc    Get appointments for a specific patient
 * @access  Private
 */
router.get('/patient/:patientId', validateIdParam, validatePagination, handleValidationErrors, appointmentController.getPatientAppointments);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post('/', validateAppointment, handleValidationErrors, appointmentController.createAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put('/:id', validateIdParam, validateAppointment, handleValidationErrors, appointmentController.updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment
 * @access  Private
 */
router.delete('/:id', validateIdParam, handleValidationErrors, appointmentController.deleteAppointment);

/**
 * @route   GET /api/appointments/today
 * @desc    Get today's appointments
 * @access  Private
 */
router.get('/today', appointmentController.getTodayAppointments);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private
 */
router.put('/:id/status', validateIdParam, handleValidationErrors, appointmentController.updateStatus);

module.exports = router;