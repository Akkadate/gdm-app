import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaTint, FaUtensils, FaWeight, FaRunning, FaCalendarAlt, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const PatientLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // เมนูสำหรับผู้ป่วย
  const patientMenuItems = [
    { to: '/patient/dashboard', icon: <FaHome />, text: 'หน้าหลัก' },
    { to: '/patient/glucose', icon: <FaTint />, text: 'บันทึกน้ำตาล' },
    { to: '/patient/meals', icon: <FaUtensils />, text: 'บันทึกอาหาร' },
    { to: '/patient/weight', icon: <FaWeight />, text: 'บันทึกน้ำหนัก' },
    { to: '/patient/activities', icon: <FaRunning />, text: 'บันทึกกิจกรรม' },
    { to: '/patient/appointments', icon: <FaCalendarAlt />, text: 'การนัดหมาย' },
    { to: '/patient/profile', icon: <FaUser />, text: 'โปรไฟล์' }
  ];

  // ฟังก์ชันจัดการการออกจากระบบ
  const handleLogout = () => {
    logout();
    toast.info('ออกจากระบบสำเร็จ');
    navigate('/login');
  };

  // ตรวจสอบว่าเมนูใดกำลังเลือกอยู่
  const isActive = (path) => {
    return location.pathname === path;
  };

  // สลับการแสดงเมนูบนมือถือ
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - แสดงเฉพาะบนจอขนาดใหญ่ */}
      <div className="hidden md:flex flex-col w-64 bg-white shadow">
        <div className="flex items-center justify-center h-20 shadow-md">
          <h1 className="text-xl font-bold text-indigo-600">GDM Care</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-2">
            {patientMenuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-2 text-gray-700 rounded-lg ${
                  isActive(item.to) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="ml-3">{item.text}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <span className="text-lg"><FaSignOutAlt /></span>
              <span className="ml-3">ออกจากระบบ</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 bg-white shadow px-6">
          <div className="flex items-center md:hidden">
            <button onClick={toggleMobileMenu} className="text-gray-500 focus:outline-none">
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            <h1 className="ml-4 text-xl font-bold text-indigo-600 md:hidden">GDM Care</h1>
          </div>
          <div className="flex items-center">
            <span className="font-medium">สวัสดี, {currentUser?.first_name || 'ผู้ใช้งาน'}</span>
          </div>
        </header>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg z-10 absolute top-16 left-0 right-0">
            <nav className="px-2 py-4 space-y-2">
              {patientMenuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-2 text-gray-700 rounded-lg ${
                    isActive(item.to) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="ml-3">{item.text}</span>
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <span className="text-lg"><FaSignOutAlt /></span>
                <span className="ml-3">ออกจากระบบ</span>
              </button>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;