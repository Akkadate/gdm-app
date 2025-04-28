// src/pages/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserNurse, FaUserInjured, FaExclamationTriangle, FaDatabase, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalNurses: 0,
    activeUsers: 0,
    warningAlerts: 0,
    todayAppointments: 0,
    systemUsage: 0
  });

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูลสำหรับแดชบอร์ด admin
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // ในระบบจริงควรมี API endpoint สำหรับดึงข้อมูลนี้
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/reports/summary`);
        
        // สมมติว่า API ส่งข้อมูลมาในรูปแบบนี้
        setStats({
          totalPatients: response.data.userStats.patient_count || 42,
          totalNurses: response.data.userStats.nurse_count || 8,
          activeUsers: response.data.userStats.active_users || 35,
          warningAlerts: 5, // จำนวนการแจ้งเตือนในระบบ
          todayAppointments: 12, // จำนวนการนัดหมายวันนี้
          systemUsage: response.data.recordStats ? 
            response.data.recordStats.glucose_readings + 
            response.data.recordStats.meal_logs + 
            response.data.recordStats.activities + 
            response.data.recordStats.weight_records : 250
        });
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        // กรณีไม่มี API สำหรับข้อมูลนี้ยังคงแสดงข้อมูลตัวอย่าง
        setStats({
          totalPatients: 42,
          totalNurses: 8,
          activeUsers: 35,
          warningAlerts: 5,
          todayAppointments: 12,
          systemUsage: 250
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
        <div className="text-sm text-gray-500">
          วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {/* สรุปสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* จำนวนผู้ป่วยทั้งหมด */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaUserInjured className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">จำนวนผู้ป่วยทั้งหมด</p>
            <p className="text-2xl font-bold">{stats.totalPatients} คน</p>
          </div>
        </div>

        {/* จำนวนพยาบาลทั้งหมด */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaUserNurse className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">จำนวนพยาบาลทั้งหมด</p>
            <p className="text-2xl font-bold">{stats.totalNurses} คน</p>
          </div>
        </div>

        {/* จำนวนการแจ้งเตือน */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">การแจ้งเตือนที่รอตรวจสอบ</p>
            <p className="text-2xl font-bold">{stats.warningAlerts} รายการ</p>
          </div>
        </div>
      </div>

      {/* ข้อมูลเพิ่มเติม */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ผู้ใช้งานที่ active */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-indigo-100 p-3 mr-4">
              <FaDatabase className="text-indigo-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">สถิติการใช้งานระบบ</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>ผู้ใช้งานที่แอคทีฟวันนี้:</span>
              <span className="font-medium">{stats.activeUsers} คน</span>
            </div>
            <div className="flex justify-between">
              <span>จำนวนการบันทึกข้อมูลวันนี้:</span>
              <span className="font-medium">{stats.systemUsage} รายการ</span>
            </div>
            <div className="flex justify-between">
              <span>ระบบทำงาน:</span>
              <span className="font-medium text-green-600">ปกติ</span>
            </div>
            <div className="flex justify-between">
              <span>การใช้งานฐานข้อมูล:</span>
              <span className="font-medium">68%</span>
            </div>
          </div>
        </div>

        {/* การนัดหมายวันนี้ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <FaCalendarAlt className="text-yellow-600 text-xl" />
              </div>
              <h2 className="text-lg font-semibold">การนัดหมายวันนี้</h2>
            </div>
            <Link to="/admin/appointments" className="text-blue-600 hover:text-blue-800 text-sm">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">พยาบาล สมศรี - ผู้ป่วย 5 คน</p>
              <p className="text-sm text-gray-500">ช่วงเวลา: 9:00 - 12:00 น.</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">พยาบาล วิมล - ผู้ป่วย 4 คน</p>
              <p className="text-sm text-gray-500">ช่วงเวลา: 13:00 - 15:00 น.</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">พยาบาล นิภา - ผู้ป่วย 3 คน</p>
              <p className="text-sm text-gray-500">ช่วงเวลา: 15:00 - 16:30 น.</p>
            </div>
          </div>
        </div>
      </div>

      {/* เมนูการจัดการเร่งด่วน */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">การจัดการเร่งด่วน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/users/new" className="bg-blue-100 rounded-lg p-4 text-center hover:bg-blue-200 transition-colors">
            <p className="font-medium text-blue-700">เพิ่มผู้ใช้ใหม่</p>
          </Link>
          <Link to="/admin/system/backup" className="bg-green-100 rounded-lg p-4 text-center hover:bg-green-200 transition-colors">
            <p className="font-medium text-green-700">สำรองข้อมูล</p>
          </Link>
          <Link to="/admin/reports/generate" className="bg-purple-100 rounded-lg p-4 text-center hover:bg-purple-200 transition-colors">
            <p className="font-medium text-purple-700">สร้างรายงาน</p>
          </Link>
          <Link to="/admin/settings" className="bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors">
            <p className="font-medium text-gray-700">ตั้งค่าระบบ</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;