// src/layouts/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUserNurse, FaUserInjured, FaUserShield, FaChartLine, FaCog, FaSignOutAlt, FaBars, FaTimes, FaDatabase } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // เมนูสำหรับแอดมิน
  const adminMenuItems = [
    { to: '/admin/dashboard', icon: <FaHome />, text: 'แดชบอร์ด' },
    { to: '/admin/nurses', icon: <FaUserNurse />, text: 'จัดการพยาบาล' },
    { to: '/admin/patients', icon: <FaUserInjured />, text: 'จัดการผู้ป่วย' },
    { to: '/admin/users', icon: <FaUserShield />, text: 'จัดการผู้ใช้งาน' },
    { to: '/admin/reports', icon: <FaChartLine />, text: 'รายงาน' },
    { to: '/admin/system', icon: <FaDatabase />, text: 'จัดการระบบ' },
    { to: '/admin/settings', icon: <FaCog />, text: 'ตั้งค่า' },
  ];

  // ฟังก์ชันจัดการการออกจากระบบ
  const handleLogout = () => {
    logout();
    toast.info('ออกจากระบบสำเร็จ');
    navigate('/login');
  };

  // ตรวจสอบว่าเมนูใดกำลังเลือกอยู่
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // สลับการแสดงเมนูบนมือถือ
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - แสดงเฉพาะบนจอขนาดใหญ่ */}
      <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white shadow">
        <div className="flex items-center justify-center h-20 shadow-md bg-gray-800">
          <h1 className="text-xl font-bold text-yellow-400">GDM Admin Panel</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-2">
            {adminMenuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  isActive(item.to) ? 'bg-gray-700 text-yellow-400' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="ml-3">{item.text}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white"
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
            <button onClick={toggleMobileMenu} className="text-gray-700 focus:outline-none">
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            <h1 className="ml-4 text-xl font-bold text-yellow-600 md:hidden">GDM Admin</h1>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700">
              แอดมิน: {currentUser?.first_name || 'ผู้ดูแลระบบ'}
            </span>
          </div>
        </header>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 text-white shadow-lg z-10 absolute top-16 left-0 right-0">
            <nav className="px-2 py-4 space-y-2">
              {adminMenuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    isActive(item.to) ? 'bg-gray-700 text-yellow-400' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white"
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

export default AdminLayout;