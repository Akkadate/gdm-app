import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { API_URL } from "../config"; // เพิ่มบรรทัดนี้

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ตรวจสอบว่ามี token ใน localStorage หรือไม่
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // ตรวจสอบว่า token หมดอายุหรือไม่
          const decodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 < Date.now()) {
            // ถ้า token หมดอายุให้ออกจากระบบ
            handleLogout();
          } else {
            // ตั้งค่า Authorization header
            axios.defaults.headers.common["x-auth-token"] = token;

            // ดึงข้อมูลผู้ใช้จาก API
            // แก้ไขในฟังก์ชัน checkToken
            const res = await axios.get(`${API_URL}/auth/me`);
            setCurrentUser(res.data);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error("Error checking token:", err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  // ฟังก์ชันลงทะเบียนผู้ใช้ใหม่
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = res.data;

      // เก็บ token ใน localStorage
      localStorage.setItem("token", token);

      // ตั้งค่า Authorization header
      axios.defaults.headers.common["x-auth-token"] = token;

      // อัปเดตสถานะการเข้าสู่ระบบ
      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
      return {
        success: false,
        error: err.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน",
      };
    }
  };

  // ฟังก์ชันเข้าสู่ระบบ
  const login = async (credentials) => {
    try {
      setError(null);
      // แปลง hospital_id เป็น email
      const loginData = {
        email: credentials.hospital_id,
        password: credentials.password,
      };
      const res = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user } = res.data;

      // เก็บ token ใน localStorage
      localStorage.setItem("token", token);

      // ตั้งค่า Authorization header
      axios.defaults.headers.common["x-auth-token"] = token;

      // อัปเดตสถานะการเข้าสู่ระบบ
      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      return {
        success: false,
        error: err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      };
    }
  };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    // ลบ token จาก localStorage
    localStorage.removeItem("token");

    // ล้าง Authorization header
    delete axios.defaults.headers.common["x-auth-token"];

    // รีเซ็ตสถานะ
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // ฟังก์ชันตรวจสอบว่าเป็นพยาบาลหรือแอดมิน
  const isNurseOrAdmin = () => {
    return (
      currentUser &&
      (currentUser.role === "nurse" || currentUser.role === "admin")
    );
  };

  // ฟังก์ชันตรวจสอบว่าเป็นแอดมิน
  const isAdmin = () => {
    return currentUser && currentUser.role === "admin";
  };

  // ฟังก์ชันตรวจสอบว่าเป็นผู้ป่วย
  const isPatient = () => {
    return currentUser && currentUser.role === "patient";
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout: handleLogout,
    isNurseOrAdmin,
    isAdmin,
    isPatient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
