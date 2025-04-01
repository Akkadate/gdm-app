// frontend/src/services/userService.js
import api from './api'; // แก้ไขจาก import { apiClient } from './api';

// คงส่วนอื่นๆ ของโค้ดไว้เหมือนเดิม แต่ใช้ api แทน apiClient
// ตัวอย่างเช่น:

export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async () => {
  try {
    const response = await api.delete('/users/account');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// เพิ่มฟังก์ชันอื่นๆ ตามที่จำเป็น