import { format, parseISO, isValid } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Formats a date to Thai locale string representation
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'd MMM yyyy') => {
  if (!date) return '';
  
  try {
    let dateObj;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) return date;
    } else {
      dateObj = date;
    }
    
    return format(dateObj, formatStr, { locale: th });
  } catch (e) {
    console.error('Error formatting date:', e);
    return date;
  }
};

/**
 * Formats a time string (HH:MM:SS) to display format (HH:MM)
 * @param {string} timeStr - Time string in HH:MM:SS format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Remove seconds if present
  if (timeStr.length > 5) {
    return timeStr.substring(0, 5);
  }
  
  return timeStr;
};

/**
 * Formats a date and time together
 * @param {string|Date} date - Date to format
 * @param {string} time - Time string
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, time) => {
  if (!date) return '';
  
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  
  if (formattedTime) {
    return `${formattedDate} ${formattedTime} น.`;
  }
  
  return formattedDate;
};

/**
 * Formats a number to Thai baht format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a number with thousand separators
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '';
  
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Formats a glucose reading value with unit
 * @param {number} value - Glucose value
 * @returns {string} Formatted glucose value with unit
 */
export const formatGlucose = (value) => {
  if (value === null || value === undefined) return '';
  
  return `${formatNumber(value, 0)} mg/dL`;
};

/**
 * Formats a phone number to Thai format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    // Mobile number: 08-XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 9) {
    // Bangkok number: 0X-XXX-XXXX
    return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  // Return as is if can't format
  return phone;
};

/**
 * Truncates text to a specific length and adds ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
};

/**
 * Converts risk level code to Thai display text
 * @param {string} riskLevel - Risk level code
 * @returns {string} Risk level text in Thai
 */
export const formatRiskLevel = (riskLevel) => {
  switch (riskLevel) {
    case 'high':
      return 'ความเสี่ยงสูง';
    case 'medium':
      return 'ความเสี่ยงปานกลาง';
    case 'low':
      return 'ความเสี่ยงต่ำ';
    default:
      return riskLevel || '';
  }
};

/**
 * Converts appointment status code to Thai display text
 * @param {string} status - Appointment status code
 * @returns {string} Status text in Thai
 */
export const formatAppointmentStatus = (status) => {
  switch (status) {
    case 'scheduled':
      return 'นัดหมาย';
    case 'completed':
      return 'เสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิก';
    case 'no-show':
      return 'ไม่มาตามนัด';
    default:
      return status || '';
  }
};

/**
 * Converts user role code to Thai display text
 * @param {string} role - User role code
 * @returns {string} Role text in Thai
 */
export const formatUserRole = (role) => {
  switch (role) {
    case 'admin':
      return 'ผู้ดูแลระบบ';
    case 'doctor':
      return 'แพทย์';
    case 'nurse':
      return 'พยาบาล';
    case 'receptionist':
      return 'เจ้าหน้าที่ต้อนรับ';
    default:
      return role || '';
  }
};

/**
 * Converts glucose reading type code to Thai display text
 * @param {string} type - Reading type code
 * @returns {string} Reading type text in Thai
 */
export const formatReadingType = (type) => {
  switch (type) {
    case 'fasting':
      return 'ระดับน้ำตาลตอนเช้า';
    case 'pre-meal':
      return 'ก่อนอาหาร';
    case 'post-meal':
      return 'หลังอาหาร';
    case 'bedtime':
      return 'ก่อนนอน';
    default:
      return type || '';
  }
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatGlucose,
  formatPhone,
  truncateText,
  formatRiskLevel,
  formatAppointmentStatus,
  formatUserRole,
  formatReadingType
};