/**
 * Application configuration
 */
const config = {
  /**
   * Application environment (development, production, test)
   */
  env: process.env.NODE_ENV || 'development',
  
  /**
   * Server port
   */
  port: process.env.PORT || 5000,
  
  /**
   * Database configuration (from db.js)
   */
  db: require('./db'),
  
  /**
   * JWT configuration
   */
  jwt: {
    secret: process.env.JWT_SECRET || 'gdmsecretkey',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  
  /**
   * CORS configuration
   */
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://gdm.example.com'] 
      : ['http://localhost:3000'],
    credentials: true
  },
  
  /**
   * Glucose reading thresholds (mg/dL)
   */
  glucoseThresholds: {
    fasting: {
      low: 70,
      high: 95
    },
    preMeal: {
      low: 70,
      high: 100
    },
    postMeal: {
      low: 70,
      high: 140
    },
    bedtime: {
      low: 70,
      high: 120
    }
  },
  
  /**
   * Risk calculation weights
   */
  riskWeights: {
    age35plus: 1,
    bmi30plus: 1,
    familyHistory: 1,
    previousGDM: 3,
    previousMacrosomia: 1
  },
  
  /**
   * Logging configuration
   */
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
};

module.exports = config;