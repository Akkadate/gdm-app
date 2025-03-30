const express = require('express');
const glucoseController = require('../controllers/glucoseController');
const { protect } = require('../middleware/auth');
const { validateGlucoseReading, validateIdParam, validatePagination, validateDateRange, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

/**
 * @route   GET /api/glucose
 * @desc    Get all glucose readings with pagination and filtering
 * @access  Private
 */
router.get('/', validatePagination, validateDateRange, handleValidationErrors, glucoseController.getReadings);

/**
 * @route   GET /api/glucose/:id
 * @desc    Get single glucose reading by ID
 * @access  Private
 */
router.get('/:id', validateIdParam, handleValidationErrors, glucoseController.getReading);

/**
 * @route   GET /api/glucose/patient/:patientId
 * @desc    Get glucose readings for a specific patient
 * @access  Private
 */
router.get('/patient/:patientId', validateIdParam, validatePagination, validateDateRange, handleValidationErrors, glucoseController.getPatientReadings);

/**
 * @route   POST /api/glucose
 * @desc    Create new glucose reading
 * @access  Private
 */
router.post('/', validateGlucoseReading, handleValidationErrors, glucoseController.createReading);

/**
 * @route   PUT /api/glucose/:id
 * @desc    Update glucose reading
 * @access  Private
 */
router.put('/:id', validateIdParam, validateGlucoseReading, handleValidationErrors, glucoseController.updateReading);

/**
 * @route   DELETE /api/glucose/:id
 * @desc    Delete glucose reading
 * @access  Private
 */
router.delete('/:id', validateIdParam, handleValidationErrors, glucoseController.deleteReading);

/**
 * @route   GET /api/glucose/patient/:patientId/stats
 * @desc    Get glucose statistics for a patient
 * @access  Private
 */
router.get('/patient/:patientId/stats', validateIdParam, validateDateRange, handleValidationErrors, glucoseController.getPatientStats);

/**
 * @route   GET /api/glucose/out-of-range
 * @desc    Get out of range readings
 * @access  Private
 */
router.get('/out-of-range', glucoseController.getOutOfRangeReadings);

/**
 * @route   POST /api/glucose/bulk-import
 * @desc    Bulk import glucose readings
 * @access  Private
 */
router.post('/bulk-import', glucoseController.bulkImport);

module.exports = router;