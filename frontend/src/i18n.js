import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Thai translations
const thTranslations = {
  common: {
    loading: "กำลังโหลด...",
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    confirm: "ยืนยัน",
    back: "ย้อนกลับ",
  },
  auth: {
    login: "เข้าสู่ระบบ",
    register: "ลงทะเบียน",
    email: "อีเมล",
    password: "รหัสผ่าน",
    forgotPassword: "ลืมรหัสผ่าน?",
  },
  patient: {
    dashboard: "แดชบอร์ด",
    glucose: "บันทึกค่าน้ำตาล",
    meal: "บันทึกอาหาร",
    weight: "บันทึกน้ำหนัก",
    activity: "บันทึกกิจกรรม",
    appointment: "การนัดหมาย",
  },
  nurse: {
    dashboard: "แดชบอร์ด",
    patients: "รายชื่อผู้ป่วย",
    treatments: "แผนการรักษา",
    reports: "รายงาน",
  },
  treatments: {
    title: "แผนการรักษา",
    new: "เพิ่มแผนการรักษาใหม่",
    type: "ประเภทแผนการรักษา",
    name: "ชื่อแผนการรักษา",
    description: "รายละเอียด",
    startDate: "วันที่เริ่มต้น",
    endDate: "วันที่สิ้นสุด",
    status: "สถานะ",
    actions: "การจัดการ",
    noTreatments: "ยังไม่มีแผนการรักษาสำหรับผู้ป่วยรายนี้",
    types: {
      diet: "แผนโภชนาการ",
      exercise: "แผนการออกกำลังกาย",
      medication: "แผนการใช้ยา",
      monitoring: "แผนการติดตามค่าน้ำตาล",
      other: "อื่นๆ",
    },
    statuses: {
      active: "กำลังใช้งาน",
      completed: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
    },
    actions: {
      complete: "เสร็จสิ้น",
      cancel: "ยกเลิก",
      activate: "เปิดใช้งาน",
      delete: "ลบ",
    },
  },
};

// English translations
const enTranslations = {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    back: "Back",
  },
  auth: {
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
  },
  patient: {
    dashboard: "Dashboard",
    glucose: "Glucose Log",
    meal: "Meal Log",
    weight: "Weight Log",
    activity: "Activity Log",
    appointment: "Appointments",
  },
  nurse: {
    dashboard: "Dashboard",
    patients: "Patient List",
    treatments: "Treatment Plans",
    reports: "Reports",
  },
  treatments: {
    title: "Treatment Plans",
    new: "Add New Treatment Plan",
    type: "Treatment Type",
    name: "Treatment Name",
    description: "Description",
    startDate: "Start Date",
    endDate: "End Date",
    status: "Status",
    actions: "Actions",
    noTreatments: "No treatment plans for this patient yet",
    types: {
      diet: "Diet Plan",
      exercise: "Exercise Plan",
      medication: "Medication Plan",
      monitoring: "Glucose Monitoring Plan",
      other: "Other",
    },
    statuses: {
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    actions: {
      complete: "Complete",
      cancel: "Cancel",
      activate: "Activate",
      delete: "Delete",
    },
  },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    th: {
      translation: thTranslations,
    },
    en: {
      translation: enTranslations,
    },
  },
  lng: "th", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
});

export default i18n;
