const express = require('express');
const patientController = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const { validatePatient, validateIdParam, validatePagination, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination and filtering
 * @access  Private
 */
router.get('/', validatePagination, handleValidationErrors, patientController.getPatients);

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient by ID
 * @access  Private
 */
router.get('/:id', validateIdParam, handleValidationErrors, patientController.getPatient);

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 * @access  Private
 */
router.post('/', validatePatient, handleValidationErrors, patientController.createPatient);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private
 */
router.put('/:id', validateIdParam, validatePatient, handleValidationErrors, patientController.updatePatient);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete patient
 * @access  Private/Admin
 */
router.delete('/:id', validateIdParam, handleValidationErrors, authorize('admin'), patientController.deletePatient);

/**
 * @route   POST /api/patients/:id/calculate-risk
 * @desc    Calculate and update patient risk level
 * @access  Private
 */
router.post('/:id/calculate-risk', validateIdParam, handleValidationErrors, patientController.calculateRisk);

/**
 * @route   GET /api/patients/risk-distribution
 * @desc    Get risk distribution data
 * @access  Private
 */
router.get('/risk-distribution', patientController.getRiskDistribution);

module.exports = router;