// Configuration for different environments

// Development environment
const devConfig = {
  API_URL: "http://localhost:4700/api", // Assume API is served from same domain in development_TOKEN_KEY: "gdm_auth_token",
  REFRESH_TOKEN_KEY: "gdm_refresh_token",
  SITE_NAME: "GDM App - พัฒนา",
};

// Production environment
const prodConfig = {
  API_URL: "/api", // Assume API is served from same domain in production
  AUTH_TOKEN_KEY: "gdm_auth_token",
  REFRESH_TOKEN_KEY: "gdm_refresh_token",
  SITE_NAME: "GDM App",
};

// Testing environment
const testConfig = {
  API_URL: "http://localhost:4700/api",
  AUTH_TOKEN_KEY: "gdm_auth_token_test",
  REFRESH_TOKEN_KEY: "gdm_refresh_token_test",
  SITE_NAME: "GDM App - ทดสอบ",
};

// Determine which config to use based on environment
let config;
if (process.env.NODE_ENV === "production") {
  config = prodConfig;
} else if (process.env.NODE_ENV === "test") {
  config = testConfig;
} else {
  config = devConfig;
}

// Additional configuration
const additionalConfig = {
  DEFAULT_PAGINATION_LIMIT: 10,
  GLUCOSE_RANGE: {
    NORMAL: { min: 70, max: 125 },
    FASTING: { min: 70, max: 95 },
    ONE_HOUR: { min: 70, max: 140 },
    TWO_HOUR: { min: 70, max: 120 },
  },
  WEIGHT_UNITS: ["kg", "lb"],
  GLUCOSE_UNITS: ["mg/dL", "mmol/L"],
  MEAL_TYPES: ["breakfast", "lunch", "dinner", "snack"],
  GLUCOSE_MEASUREMENT_TIMES: [
    "fasting",
    "before_meal",
    "after_meal",
    "bedtime",
    "other",
  ],
  DATE_FORMAT: "DD/MM/YYYY",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "DD/MM/YYYY HH:mm",
};

// Combine all configs
const finalConfig = {
  ...config,
  ...additionalConfig,
};

// Export individual values for destructuring
export const {
  API_URL,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SITE_NAME,
  DEFAULT_PAGINATION_LIMIT,
  GLUCOSE_RANGE,
  WEIGHT_UNITS,
  GLUCOSE_UNITS,
  MEAL_TYPES,
  GLUCOSE_MEASUREMENT_TIMES,
  DATE_FORMAT,
  TIME_FORMAT,
  DATETIME_FORMAT,
} = finalConfig;

// Export the whole config object as default
export default finalConfig;
