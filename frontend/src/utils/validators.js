/**
 * Email validation
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate required field
 * @param {*} value - Field value to check
 * @returns {boolean} True if field is not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate minimum length
 * @param {string} value - String to check
 * @param {number} min - Minimum length
 * @returns {boolean} True if string meets minimum length
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return String(value).length >= min;
};

/**
 * Validate maximum length
 * @param {string} value - String to check
 * @param {number} max - Maximum length
 * @returns {boolean} True if string doesn't exceed maximum length
 */
export const maxLength = (value, max) => {
  if (!value) return true; // Empty value is handled by isRequired
  return String(value).length <= max;
};

/**
 * Validate phone number (Thai format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Thai mobile: 10 digits starting with 0
  const mobileRegex = /^0[6-9][0-9]{8}$/;
  
  // Thai landline: 9 digits starting with 0
  const landlineRegex = /^0[2-5][0-9]{7}$/;
  
  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
};

/**
 * Validate Thai ID card number
 * @param {string} id - ID card number to validate
 * @returns {boolean} True if ID card number is valid
 */
export const isValidThaiID = (id) => {
  if (!id) return false;
  
  // Remove non-digit characters
  const cleaned = id.replace(/\D/g, '');
  
  // Must be 13 digits
  if (cleaned.length !== 13) return false;
  
  // Validate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return parseInt(cleaned.charAt(12)) === checkDigit;
};

/**
 * Validate numeric value
 * @param {*} value - Value to check
 * @returns {boolean} True if value is numeric
 */
export const isNumeric = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate if value is within range
 * @param {number} value - Value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if value is within range
 */
export const isInRange = (value, min, max) => {
  if (!isNumeric(value)) return false;
  
  const num = parseFloat(value);
  return num >= min && num <= max;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets strength requirements
 */
export const isStrongPassword = (password) => {
  if (!password) return false;
  
  // At least 8 characters, at least one uppercase letter, one lowercase letter,
  // one number, and one special character
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  return strongRegex.test(password);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if date format is valid
 */
export const isValidDateFormat = (date) => {
  if (!date) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  // Check if it's a valid date
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
  const day = parseInt(parts[2], 10);
  
  const dateObj = new Date(year, month, day);
  return dateObj.getFullYear() === year &&
         dateObj.getMonth() === month &&
         dateObj.getDate() === day;
};

/**
 * Validate time format (HH:MM or HH:MM:SS)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if time format is valid
 */
export const isValidTimeFormat = (time) => {
  if (!time) return false;
  
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  return regex.test(time);
};

/**
 * Validate MRN format (Medical Record Number)
 * @param {string} mrn - MRN to validate
 * @returns {boolean} True if MRN format is valid
 */
export const isValidMRN = (mrn) => {
  if (!mrn) return false;
  
  // Basic validation: alphanumeric characters and hyphens, 5-20 characters
  const regex = /^[A-Za-z0-9\-]{5,20}$/;
  return regex.test(mrn);
};

/**
 * Validate if passwords match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean} True if passwords match
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * General form validator that runs multiple validation rules
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation errors
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    // Required field validation
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = fieldRules.requiredMessage || 'กรุณากรอกข้อมูลในช่องนี้';
      return; // Skip further validation for this field
    }
    
    // Skip further validation if field is empty and not required
    if (!isRequired(value) && !fieldRules.required) return;
    
    // Min length validation
    if (fieldRules.minLength && !minLength(value, fieldRules.minLength)) {
      errors[field] = fieldRules.minLengthMessage || 
        `ต้องมีความยาวอย่างน้อย ${fieldRules.minLength} ตัวอักษร`;
      return;
    }
    
    // Max length validation
    if (fieldRules.maxLength && !maxLength(value, fieldRules.maxLength)) {
      errors[field] = fieldRules.maxLengthMessage || 
        `ความยาวต้องไม่เกิน ${fieldRules.maxLength} ตัวอักษร`;
      return;
    }
    
    // Email validation
    if (fieldRules.isEmail && !isValidEmail(value)) {
      errors[field] = fieldRules.emailMessage || 'รูปแบบอีเมลไม่ถูกต้อง';
      return;
    }
    
    // Numeric validation
    if (fieldRules.isNumeric && !isNumeric(value)) {
      errors[field] = fieldRules.numericMessage || 'ต้องเป็นตัวเลขเท่านั้น';
      return;
    }
    
    // Range validation
    if (fieldRules.min !== undefined && fieldRules.max !== undefined) {
      if (!isInRange(value, fieldRules.min, fieldRules.max)) {
        errors[field] = fieldRules.rangeMessage || 
          `ค่าต้องอยู่ระหว่าง ${fieldRules.min} และ ${fieldRules.max}`;
        return;
      }
    }
    
    // Phone validation
    if (fieldRules.isPhone && !isValidPhone(value)) {
      errors[field] = fieldRules.phoneMessage || 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
      return;
    }
    
    // Thai ID validation
    if (fieldRules.isThaiID && !isValidThaiID(value)) {
      errors[field] = fieldRules.thaiIDMessage || 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง';
      return;
    }
    
    // Date format validation
    if (fieldRules.isDate && !isValidDateFormat(value)) {
      errors[field] = fieldRules.dateMessage || 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)';
      return;
    }
    
    // Time format validation
    if (fieldRules.isTime && !isValidTimeFormat(value)) {
      errors[field] = fieldRules.timeMessage || 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)';
      return;
    }
    
    // MRN validation
    if (fieldRules.isMRN && !isValidMRN(value)) {
      errors[field] = fieldRules.mrnMessage || 'รูปแบบรหัสผู้ป่วยไม่ถูกต้อง';
      return;
    }
    
    // Custom validator
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customResult = fieldRules.custom(value, data);
      if (customResult !== true) {
        errors[field] = customResult || fieldRules.customMessage || 'ข้อมูลไม่ถูกต้อง';
        return;
      }
    }
  });
  
  return errors;
};

export default {
  isValidEmail,
  isRequired,
  minLength,
  maxLength,
  isValidPhone,
  isValidThaiID,
  isNumeric,
  isInRange,
  isStrongPassword,
  isValidDateFormat,
  isValidTimeFormat,
  isValidMRN,
  passwordsMatch,
  validateForm
};