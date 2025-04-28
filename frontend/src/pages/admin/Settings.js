// src/pages/admin/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaSave, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    appName: 'GDM App',
    notificationEmail: 'admin@gdmapp.devapp.cc',
    glucoseUnits: 'mg/dL',
    weightUnits: 'kg',
    enableSMS: true,
    enableEmailNotifications: true,
    appointmentReminderHours: 24,
    criticalGlucoseThreshold: 200,
    lowGlucoseThreshold: 60,
    glucoseRemindersEnabled: true,
    autoBackupEnabled: true,
    autoBackupTime: '02:00',
    maxBackupFiles: 10,
    sessionTimeoutMinutes: 30,
    apiRequestLimit: 100,
    maintenanceMode: false,
    maintenanceMessage: 'ระบบอยู่ระหว่างการปรับปรุง กรุณากลับมาใหม่ในภายหลัง',
    logRetentionDays: 30,
    defaultLanguage: 'th'
  });
  
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // ในระบบจริงควรมี API endpoint สำหรับดึงการตั้งค่า
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/settings`);
        // setSettings(response.data);
        // setOriginalSettings(response.data);
        
        // ใช้ข้อมูลตัวอย่างแทน
        setOriginalSettings({...settings});
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // ฟังก์ชั่นจัดการเมื่อมีการเปลี่ยนแปลงฟอร์ม
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // ฟังก์ชั่นบันทึกการตั้งค่า
  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // ในระบบจริงควรมี API endpoint สำหรับบันทึกการตั้งค่า
      // await axios.put(`${process.env.REACT_APP_API_URL}/settings`, settings);
      
      // จำลองการบันทึก
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalSettings({...settings});
      toast.success('บันทึกการตั้งค่าเรียบร้อย');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  // ฟังก์ชั่นคืนค่าการตั้งค่าเดิม
  const resetSettings = () => {
    if (window.confirm('คุณต้องการคืนค่าการตั้งค่าเดิมใช่หรือไม่?')) {
      setSettings({...originalSettings});
      toast.info('คืนค่าการตั้งค่าเดิมเรียบร้อย');
    }
  };

  // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">ตั้งค่าระบบ</h1>
        <p className="text-gray-600">กำหนดค่าต่างๆ ของระบบ GDM App</p>
      </div>

      <form onSubmit={saveSettings}>
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* การตั้งค่าทั่วไป */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaCog className="text-blue-600 mr-2" /> การตั้งค่าทั่วไป
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อระบบ</label>
                <input
                  type="text"
                  name="appName"
                  value={settings.appName}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้ดูแลระบบ</label>
                <input
                  type="email"
                  name="notificationEmail"
                  value={settings.notificationEmail}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยวัดน้ำตาลในเลือด</label>
                <select
                  name="glucoseUnits"
                  value={settings.glucoseUnits}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยวัดน้ำหนัก</label>
                <select
                  name="weightUnits"
                  value={settings.weightUnits}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="kg">กิโลกรัม (kg)</option>
                  <option value="lb">ปอนด์ (lb)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ภาษาเริ่มต้น</label>
                <select
                  name="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <option value="th">ไทย</option>
                  <option value="en">อังกฤษ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาหมดอายุเซสชัน (นาที)</label>
                <input
                  type="number"
                  name="sessionTimeoutMinutes"
                  min="5"
                  max="120"
                  value={settings.sessionTimeoutMinutes}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          {/* การตั้งค่าการแจ้งเตือน */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">การตั้งค่าการแจ้งเตือน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableEmailNotifications"
                  name="enableEmailNotifications"
                  checked={settings.enableEmailNotifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-700">
                  เปิดใช้งานการแจ้งเตือนทางอีเมล
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSMS"
                  name="enableSMS"
                  checked={settings.enableSMS}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableSMS" className="ml-2 block text-sm text-gray-700">
                  เปิดใช้งานการแจ้งเตือนทาง SMS
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แจ้งเตือนการนัดหมายล่วงหน้า (ชั่วโมง)</label>
                <input
                  type="number"
                  name="appointmentReminderHours"
                  min="1"
                  max="72"
                  value={settings.appointmentReminderHours}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="glucoseRemindersEnabled"
                  name="glucoseRemindersEnabled"
                  checked={settings.glucoseRemindersEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="glucoseRemindersEnabled" className="ml-2 block text-sm text-gray-700">
                  เปิดใช้งานการแจ้งเตือนค่าน้ำตาลผิดปกติ
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เกณฑ์ค่าน้ำตาลสูง (mg/dL)</label>
                <input
                  type="number"
                  name="criticalGlucoseThreshold"
                  min="120"
                  max="300"
                  value={settings.criticalGlucoseThreshold}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เกณฑ์ค่าน้ำตาลต่ำ (mg/dL)</label>
                <input
                  type="number"
                  name="lowGlucoseThreshold"
                  min="40"
                  max="80"
                  value={settings.lowGlucoseThreshold}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          {/* การตั้งค่าการสำรองข้อมูล */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">การตั้งค่าการสำรองข้อมูล</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoBackupEnabled"
                  name="autoBackupEnabled"
                  checked={settings.autoBackupEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoBackupEnabled" className="ml-2 block text-sm text-gray-700">
                  เปิดใช้งานการสำรองข้อมูลอัตโนมัติ
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสำรองข้อมูลอัตโนมัติ</label>
                <input
                  type="time"
                  name="autoBackupTime"
                  value={settings.autoBackupTime}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนไฟล์สำรองสูงสุด</label>
                <input
                  type="number"
                  name="maxBackupFiles"
                  min="3"
                  max="30"
                  value={settings.maxBackupFiles}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนวันที่เก็บล็อก</label>
                <input
                  type="number"
                  name="logRetentionDays"
                  min="7"
                  max="90"
                  value={settings.logRetentionDays}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          {/* การตั้งค่าโหมดบำรุงรักษาระบบ */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">โหมดบำรุงรักษาระบบ</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="flex items-center text-yellow-800">
                <FaExclamationTriangle className="text-yellow-600 mr-2" />
                การเปิดใช้งานโหมดบำรุงรักษาจะทำให้ผู้ใช้ทั้งหมดไม่สามารถเข้าถึงระบบได้ ยกเว้นผู้ดูแลระบบ
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700 font-medium">
                  เปิดใช้งานโหมดบำรุงรักษาระบบ
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความแจ้งเตือนโหมดบำรุงรักษา</label>
                <textarea
                  name="maintenanceMessage"
                  value={settings.maintenanceMessage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={resetSettings}
            disabled={!hasChanges() || saving}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUndo className="mr-2" /> คืนค่าเดิม
          </button>
          <button
            type="submit"
            disabled={!hasChanges() || saving}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;