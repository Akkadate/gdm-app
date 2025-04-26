// Simple i18n implementation without external dependencies

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
  // ... rest of translations
};

// Default to Thai
let currentLanguage = "th";
let translations = thTranslations;

// Simple translation function
const t = (key) => {
  const keys = key.split(".");
  let result = translations;

  for (const k of keys) {
    if (result[k] === undefined) {
      return key; // Return the key if translation not found
    }
    result = result[k];
  }

  return result;
};

// Simple language switcher
const changeLanguage = (lang) => {
  if (lang === "th") {
    translations = thTranslations;
    currentLanguage = "th";
  }
  // Add more languages here if needed
};

// Export translation helper
export { t, changeLanguage };

// Dummy i18n object for compatibility
const i18n = {
  t,
  changeLanguage,
  language: currentLanguage,
};

export default i18n;
