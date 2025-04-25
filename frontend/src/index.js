import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import './i18n'; // สำหรับระบบหลายภาษา (ถ้าต้องการในอนาคต)

// ตั้งค่า Axios เริ่มต้น
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://gdmapp.devapp.cc/api';

// เพิ่ม token จาก localStorage ไปใน header ของทุก request (หากมี)
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['x-auth-token'] = token;
}

// Global axios interceptor เพื่อจัดการข้อผิดพลาด
axios.interceptors.response.use(
  response => response,
  error => {
    // จัดการข้อผิดพลาดเกี่ยวกับการยืนยันตัวตน
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer 
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </React.StrictMode>
);