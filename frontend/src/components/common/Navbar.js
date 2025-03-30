import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { success } = useAlert();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock notifications for demo
  const notifications = [
    {
      id: 1,
      title: 'ค่าน้ำตาลสูงผิดปกติ',
      message: 'คนไข้ นางสาวกรรณิการ์ ใจดี มีค่าน้ำตาลสูงเกิน 180 mg/dL ติดต่อกัน 3 วัน',
      time: '10 นาทีที่แล้ว',
      read: false
    },
    {
      id: 2,
      title: 'นัดหมายวันนี้',
      message: 'คุณมีนัดหมายกับผู้ป่วย 5 คนในวันนี้',
      time: '2 ชั่วโมงที่แล้ว',
      read: true
    }
  ];
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/patients?search=${searchTerm}`);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      success('ออกจากระบบเรียบร้อยแล้ว');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isProfileOpen) setIsProfileOpen(false);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Search */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">ค้นหา</label>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ค้นหาผู้ป่วย"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
          </div>
          
          {/* Right side - Notifications and Profile */}
          <div className="flex items-center">
            {/* Notifications */}
            <div className="relative ml-3">
              <button
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={toggleNotifications}
              >
                <span className="sr-only">การแจ้งเตือน</span>
                <Bell className="h-6 w-6" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="notifications-menu">
                    <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-200">
                      การแจ้งเตือน
                    </div>
                    
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                          role="menuitem"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!notification.read ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                <Bell className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="ml-3 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-400">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    )}
                    
                    <div className="px-4 py-2 text-sm text-center border-t border-gray-200">
                      <a href="/notifications" className="text-blue-600 hover:text-blue-800">
                        ดูการแจ้งเตือนทั้งหมด
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onClick={toggleProfileMenu}
                >
                  <span className="sr-only">เปิดเมนูผู้ใช้</span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {currentUser && currentUser.first_name ? currentUser.first_name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden md:flex ml-2 text-gray-700">
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'ผู้ใช้งาน'}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {isProfileOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="py-1" role="none">
                    <a
                      href="/profile"
                      className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <User className="mr-2 h-4 w-4" /> โปรไฟล์
                    </a>
                    <a
                      href="/settings"
                      className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <Settings className="mr-2 h-4 w-4" /> ตั้งค่า
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;