/**
 * Application constants
 */

// API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Authentication
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const RISK_LEVEL_COLORS = {
  [RISK_LEVELS.LOW]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [RISK_LEVELS.MEDIUM]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  [RISK_LEVELS.HIGH]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  }
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist'
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'ผู้ดูแลระบบ',
  [USER_ROLES.DOCTOR]: 'แพทย์',
  [USER_ROLES.NURSE]: 'พยาบาล',
  [USER_ROLES.RECEPTIONIST]: 'เจ้าหน้าที่ต้อนรับ'
};

// Appointment status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'นัดหมาย',
  [APPOINTMENT_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [APPOINTMENT_STATUS.CANCELLED]: 'ยกเลิก',
  [APPOINTMENT_STATUS.NO_SHOW]: 'ไม่มาตามนัด'
};

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  }
};

// Appointment types
export const APPOINTMENT_TYPES = {
  INITIAL_ASSESSMENT: 'initial_assessment',
  FOLLOW_UP: 'follow_up',
  GLUCOSE_TEST: 'glucose_test',
  ULTRASOUND: 'ultrasound',
  NUTRITION_COUNSELING: 'nutrition_counseling',
  INSULIN_EDUCATION: 'insulin_education',
  OTHER: 'other'
};

export const APPOINTMENT_TYPE_LABELS = {
  [APPOINTMENT_TYPES.INITIAL_ASSESSMENT]: 'ตรวจประเมินครั้งแรก',
  [APPOINTMENT_TYPES.FOLLOW_UP]: 'ตรวจติดตามอาการ',
  [APPOINTMENT_TYPES.GLUCOSE_TEST]: 'ตรวจน้ำตาลในเลือด',
  [APPOINTMENT_TYPES.ULTRASOUND]: 'อัลตราซาวด์',
  [APPOINTMENT_TYPES.NUTRITION_COUNSELING]: 'ให้คำปรึกษาด้านโภชนาการ',
  [APPOINTMENT_TYPES.INSULIN_EDUCATION]: 'สอนการฉีดอินซูลิน',
  [APPOINTMENT_TYPES.OTHER]: 'อื่นๆ'
};

// Glucose reading types
export const GLUCOSE_READING_TYPES = {
  FASTING: 'fasting',
  PRE_MEAL: 'pre-meal',
  POST_MEAL: 'post-meal',
  BEDTIME: 'bedtime'
};

export const GLUCOSE_READING_TYPE_LABELS = {
  [GLUCOSE_READING_TYPES.FASTING]: 'ระดับน้ำตาลตอนเช้า',
  [GLUCOSE_READING_TYPES.PRE_MEAL]: 'ก่อนอาหาร',
  [GLUCOSE_READING_TYPES.POST_MEAL]: 'หลังอาหาร',
  [GLUCOSE_READING_TYPES.BEDTIME]: 'ก่อนนอน'
};

// Glucose target ranges
export const GLUCOSE_TARGETS = {
  [GLUCOSE_READING_TYPES.FASTING]: { min: 70, max: 95 },
  [GLUCOSE_READING_TYPES.PRE_MEAL]: { min: 70, max: 100 },
  [GLUCOSE_READING_TYPES.POST_MEAL]: { min: 70, max: 140 },
  [GLUCOSE_READING_TYPES.BEDTIME]: { min: 70, max: 120 }
};

// Common route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  PATIENT_ADD: '/patients/add',
  PATIENT_EDIT: '/patients/edit/:id',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAIL: '/appointments/:id',
  APPOINTMENT_ADD: '/appointments/add',
  GLUCOSE: '/glucose',
  GLUCOSE_ADD: '/glucose/add/:patientId',
  GLUCOSE_EDIT: '/glucose/edit/:id',
  CLINICAL_NOTES: '/clinical-notes',
  CLINICAL_NOTE_ADD: '/clinical-notes/add/:patientId',
  CLINICAL_NOTE_EDIT: '/clinical-notes/edit/:id',
  SETTINGS: '/settings',
  REGISTER: '/register'
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#10b981', // emerald-500
  tertiary: '#ef4444', // red-500
  quaternary: '#8b5cf6', // violet-500
  warning: '#f59e0b', // amber-500
  success: '#22c55e', // green-500
  error: '#ef4444', // red-500
  info: '#3b82f6' // blue-500
};

// Date format strings
export const DATE_FORMATS = {
  FULL: 'd MMMM yyyy',
  SHORT: 'd MMM yyyy',
  ISO: 'yyyy-MM-dd',
  MONTH_YEAR: 'MMMM yyyy'
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'gdm_token',
  USER: 'gdm_user',
  THEME: 'gdm_theme',
  LANGUAGE: 'gdm_language',
  REMEMBER_USERNAME: 'gdm_remember_username'
};

// Clinical note types
export const CLINICAL_NOTE_TYPES = {
  GENERAL: 'general',
  FOLLOW_UP: 'follow_up',
  LAB_RESULT: 'lab_result',
  MEDICATION: 'medication',
  DIET: 'diet',
  OTHER: 'other'
};

export const CLINICAL_NOTE_TYPE_LABELS = {
  [CLINICAL_NOTE_TYPES.GENERAL]: 'บันทึกทั่วไป',
  [CLINICAL_NOTE_TYPES.FOLLOW_UP]: 'บันทึกการติดตามอาการ',
  [CLINICAL_NOTE_TYPES.LAB_RESULT]: 'บันทึกผลแล็บ',
  [CLINICAL_NOTE_TYPES.MEDICATION]: 'บันทึกการให้ยา',
  [CLINICAL_NOTE_TYPES.DIET]: 'บันทึกเรื่องอาหาร',
  [CLINICAL_NOTE_TYPES.OTHER]: 'บันทึกอื่นๆ'
};

export default {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  RISK_LEVELS,
  RISK_LEVEL_COLORS,
  USER_ROLES,
  USER_ROLE_LABELS,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_LABELS,
  GLUCOSE_READING_TYPES,
  GLUCOSE_READING_TYPE_LABELS,
  GLUCOSE_TARGETS,
  ROUTES,
  CHART_COLORS,
  DATE_FORMATS,
  STORAGE_KEYS,
  CLINICAL_NOTE_TYPES,
  CLINICAL_NOTE_TYPE_LABELS
};