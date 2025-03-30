const logger = require('./logger');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];
  
  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Validation Error';
      errors = Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message
      }));
      break;
      
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Authentication Error';
      break;
      
    case 'SequelizeUniqueConstraintError':
      statusCode = 400;
      message = 'Database Constraint Error';
      errors = err.errors.map(error => ({
        field: error.path,
        message: `${error.path} already exists`
      }));
      break;
      
    case 'SequelizeForeignKeyConstraintError':
      statusCode = 400;
      message = 'Database Foreign Key Error';
      break;
      
    case 'SequelizeValidationError':
      statusCode = 400;
      message = 'Database Validation Error';
      errors = err.errors.map(error => ({
        field: error.path,
        message: error.message
      }));
      break;
  }
  
  // For development environment, include the stack trace
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  
  // Send the error response
  res.status(statusCode).json({
    status: 'error',
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack
  });
};

module.exports = errorHandler;