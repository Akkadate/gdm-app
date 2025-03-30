import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  FileMedical,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Define sidebar navigation items
  const navigationItems = [
    {
      name: 'แดชบอร์ด',
      icon: <Home className="w-6 h-6" />,
      path: '/',
      role: ['admin', 'doctor', 'nurse', 'receptionist']
    },
    {
      name: 'ผู้ป่วย',
      icon: <Users className="w-6 h-6" />,
      path: '/patients',
      role: ['admin', 'doctor', 'nurse', 'receptionist']
    },
    {
      name: 'นัดหมาย',
      icon: <Calendar className="w-6 h-6" />,
      path: '/appointments',
      role: ['admin', 'doctor', 'nurse', 'receptionist']
    },
    {
      name: 'ค่าน้ำตาล',
      icon: <Activity className="w-6 h-6" />,
      path: '/glucose',
      role: ['admin', 'doctor', 'nurse']
    },
    {
      name: 'บันทึกทางคลินิก',
      icon: <FileMedical className="w-6 h-6" />,
      path: '/clinical-notes',
      role: ['admin', 'doctor']
    },
    {
      name: 'รายงาน',
      icon: <BarChart2 className="w-6 h-6" />,
      path: '/reports',
      role: ['admin', 'doctor']
    },
    {
      name: 'ตั้งค่า',
      icon: <Settings className="w-6 h-6" />,
      path: '/settings',
      role: ['admin']
    }
  ];
  
  // Filter items based on user role
  const filteredItems = navigationItems.filter(item => {
    return currentUser && item.role.includes(currentUser.role);
  });
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  // Check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div 
      className={`bg-white shadow-md z-20 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* App Logo */}
      <div className="flex items-center justify-between h-16 px-4">
        {!collapsed && (
          <div className="text-xl font-bold text-blue-600">GDM Care</div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
        >
          {collapsed ? (
            <ChevronRight className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronLeft className="h-6 w-6 text-gray-500" />
          )}
        </button>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-2 py-3 ${
                collapsed ? 'justify-center' : 'justify-start'
              } rounded-md ${
                isActive(item.path)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <div className={`${!collapsed ? 'mr-3' : ''} text-center`}>
              {item.icon}
            </div>
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
      
      {/* App Version */}
      <div className={`p-4 text-xs text-gray-400 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? 'GDM Care v1.0.0' : 'v1.0.0'}
      </div>
    </div>
  );
};

export default Sidebar;