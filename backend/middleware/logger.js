const winston = require('winston');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'gdm-app' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    // Write all logs error (and below) to error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: config.logging.file 
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log') 
    })
  ]
});

// If we're not in production, log to the console with the following format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create Express middleware function for HTTP request logging
logger.middleware = (req, res, next) => {
  // Get original send function
  const originalSend = res.send;
  
  // Start time
  const startTime = Date.now();
  
  // Override send function to log response
  res.send = function(body) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log request and response
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : null
    });
    
    // Call original send function
    originalSend.call(this, body);
  };
  
  next();
};

module.exports = logger;