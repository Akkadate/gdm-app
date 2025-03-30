const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation functions for API requests
 */
const validators = {
  /**
   * Validate user registration
   */
  validateUserRegistration: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
      
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format'),
      
    body('first_name')
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
      
    body('last_name')
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
      
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'doctor', 'nurse', 'receptionist']).withMessage('Invalid role')
  ],
  
  /**
   * Validate user login
   */
  validateLogin: [
    body('username')
      .notEmpty().withMessage('Username is required'),
      
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  
  /**
   * Validate password update
   */
  validatePasswordUpdate: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
      
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  
  /**
   * Validate patient creation/update
   */
  validatePatient: [
    body('medical_record_number')
      .notEmpty().withMessage('Medical record number is required')
      .matches(/^[A-Za-z0-9-]+$/).withMessage('Medical record number can only contain letters, numbers, and hyphens'),
      
    body('first_name')
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
      
    body('last_name')
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
      
    body('date_of_birth')
      .notEmpty().withMessage('Date of birth is required')
      .isDate().withMessage('Invalid date format'),
      
    body('phone_number')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[0-9+()-\s]+$/).withMessage('Invalid phone number format'),
      
    body('email')
      .optional()
      .isEmail().withMessage('Invalid email format'),
      
    body('pre_pregnancy_weight')
      .optional()
      .isFloat({ min: 30, max: 200 }).withMessage('Pre-pregnancy weight must be between 30-200 kg'),
      
    body('current_weight')
      .optional()
      .isFloat({ min: 30, max: 200 }).withMessage('Current weight must be between 30-200 kg'),
      
    body('height')
      .optional()
      .isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
      
    body('estimated_delivery_date')
      .optional()
      .isDate().withMessage('Invalid date format'),
      
    body('weeks_pregnant')
      .optional()
      .isInt({ min: 0, max: 45 }).withMessage('Weeks pregnant must be between 0-45'),
      
    body('gravida')
      .optional()
      .isInt({ min: 0 }).withMessage('Gravida must be a positive number'),
      
    body('para')
      .optional()
      .isInt({ min: 0 }).withMessage('Para must be a positive number'),
      
    body('family_history_diabetes')
      .optional()
      .isBoolean().withMessage('Family history diabetes must be a boolean'),
      
    body('previous_gdm')
      .optional()
      .isBoolean().withMessage('Previous GDM must be a boolean'),
      
    body('previous_macrosomia')
      .optional()
      .isBoolean().withMessage('Previous macrosomia must be a boolean')
  ],
  
  /**
   * Validate appointment creation/update
   */
  validateAppointment: [
    body('patient_id')
      .notEmpty().withMessage('Patient ID is required')
      .isUUID().withMessage('Invalid patient ID format'),
      
    body('provider_id')
      .notEmpty().withMessage('Provider ID is required')
      .isUUID().withMessage('Invalid provider ID format'),
      
    body('appointment_date')
      .notEmpty().withMessage('Appointment date is required')
      .isDate().withMessage('Invalid date format'),
      
    body('appointment_time')
      .notEmpty().withMessage('Appointment time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Invalid time format (HH:MM or HH:MM:SS)'),
      
    body('duration')
      .optional()
      .isInt({ min: 5, max: 240 }).withMessage('Duration must be between 5-240 minutes'),
      
    body('appointment_type')
      .notEmpty().withMessage('Appointment type is required')
      .isLength({ max: 50 }).withMessage('Appointment type cannot exceed 50 characters'),
      
    body('status')
      .optional()
      .isIn(['scheduled', 'completed', 'cancelled', 'no-show']).withMessage('Invalid status')
  ],
  
  /**
   * Validate glucose reading creation/update
   */
  validateGlucoseReading: [
    body('patient_id')
      .notEmpty().withMessage('Patient ID is required')
      .isUUID().withMessage('Invalid patient ID format'),
      
    body('reading_date')
      .notEmpty().withMessage('Reading date is required')
      .isDate().withMessage('Invalid date format'),
      
    body('reading_time')
      .notEmpty().withMessage('Reading time is required')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Invalid time format (HH:MM or HH:MM:SS)'),
      
    body('reading_type')
      .notEmpty().withMessage('Reading type is required')
      .isIn(['fasting', 'pre-meal', 'post-meal', 'bedtime']).withMessage('Invalid reading type'),
      
    body('glucose_value')
      .notEmpty().withMessage('Glucose value is required')
      .isInt({ min: 30, max: 600 }).withMessage('Glucose value must be between 30-600 mg/dL'),
      
    body('is_manually_entered')
      .optional()
      .isBoolean().withMessage('Is manually entered must be a boolean')
  ],
  
  /**
   * Validate clinical note creation/update
   */
  validateClinicalNote: [
    body('patient_id')
      .notEmpty().withMessage('Patient ID is required')
      .isUUID().withMessage('Invalid patient ID format'),
      
    body('provider_id')
      .notEmpty().withMessage('Provider ID is required')
      .isUUID().withMessage('Invalid provider ID format'),
      
    body('note_date')
      .optional()
      .isDate().withMessage('Invalid date format'),
      
    body('note_text')
      .notEmpty().withMessage('Note text is required'),
      
    body('diagnosis')
      .optional()
      .isArray().withMessage('Diagnosis must be an array'),
      
    body('treatment_plan')
      .optional()
  ],
  
  /**
   * Validate ID parameter (UUID format)
   */
  validateIdParam: [
    param('id')
      .notEmpty().withMessage('ID is required')
      .isUUID().withMessage('Invalid ID format')
  ],
  
  /**
   * Validate pagination parameters
   */
  validatePagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
  ],
  
  /**
   * Validate date range parameters
   */
  validateDateRange: [
    query('start_date')
      .optional()
      .isDate().withMessage('Invalid start date format'),
      
    query('end_date')
      .optional()
      .isDate().withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (req.query.start_date && value < req.query.start_date) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],
  
  /**
   * Check for validation errors and handle them
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array()
      });
    }
    next();
  }
};

module.exports = validators;