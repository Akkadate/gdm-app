// src/pages/admin/System.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDatabase, FaDownload, FaUpload, FaTrash, FaCog, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const System = () => {
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    dbSize: '125 MB',
    lastBackup: '2025-03-15 14:30:45',
    uptime: '25 วัน 4 ชั่วโมง',
    userCount: 50,
    recordCount: 3500,
    diskUsage: 68,
    memoryUsage: 45,
    cpuUsage: 12
  });
  const [backups, setBackups] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลระบบและข้อมูลการสำรอง
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        // ในระบบจริงควรมี API endpoint สำหรับดึงข้อมูลระบบ
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/system/info`);
        // setSystemInfo(response.data);

        // ในระบบจริงควรมี API endpoint สำหรับดึงรายการสำรองข้อมูล
        // const backupResponse = await axios.get(`${process.env.REACT_APP_API_URL}/system/backups`);
        // setBackups(backupResponse.data);

        // ข้อมูลตัวอย่าง
        setBackups([
          { id: 1, filename: 'backup_20250415_140025.sql', size: '120MB', created_at: '2025-04-15 14:00:25', status: 'completed' },
          { id: 2, filename: 'backup_20250401_020015.sql', size: '118MB', created_at: '2025-04-01 02:00:15', status: 'completed' },
          { id: 3, filename: 'backup_20250315_143045.sql', size: '115MB', created_at: '2025-03-15 14:30:45', status: 'completed' },
          { id: 4, filename: 'backup_20250301_020020.sql', size: '110MB', created_at: '2025-03-01 02:00:20', status: 'completed' },
          { id: 5, filename: 'backup_20250215_020010.sql', size: '108MB', created_at: '2025-02-15 02:00:10', status: 'completed' }
        ]);
      } catch (error) {
        console.error('Error fetching system data:', error);
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลระบบ');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  // ฟังก์ชั่นสร้างการสำรองข้อมูล
  const createBackup = async () => {
    if (window.confirm('คุณต้องการสร้างการสำรองข้อมูลใหม่ใช่หรือไม่?')) {
      try {
        setBackupLoading(true);
        // ในระบบจริงควรมี API endpoint สำหรับสร้างการสำรองข้อมูล
        // await axios.post(`${process.env.REACT_APP_API_URL}/system/backups`);
        
        // จำลองการสร้างสำรองข้อมูล
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const now = new Date();
        const formattedDate = now.toISOString().replace(/[T:.-]/g, '').slice(0, 14);
        const newBackup = {
          id: backups.length + 1,
          filename: `backup_${formattedDate}.sql`,
          size: '125MB',
          created_at: now.toISOString().replace('T', ' ').slice(0, 19),
          status: 'completed'
        };
        
        setBackups([newBackup, ...backups]);
        setSystemInfo({
          ...systemInfo,
          lastBackup: newBackup.created_at
        });
        
        toast.success('สำรองข้อมูลสำเร็จ');
      } catch (error) {
        console.error('Error creating backup:', error);
        toast.error('เกิดข้อผิดพลาดในการสำรองข้อมูล');
      } finally {
        setBackupLoading(false);
      }
    }
  };

  // ฟังก์ชั่นดาวน์โหลดไฟล์สำรอง
  const downloadBackup = (filename) => {
    toast.info(`กำลังดาวน์โหลดไฟล์สำรอง: ${filename}`);
    // ในระบบจริงควรมีลิงก์สำหรับดาวน์โหลดไฟล์
    setTimeout(() => {
      toast.success('ดาวน์โหลดไฟล์สำรองสำเร็จ');
    }, 1500);
  };

  // ฟังก์ชั่นลบไฟล์สำรอง
  const deleteBackup = (id, filename) => {
    if (window.confirm(`คุณต้องการลบไฟล์สำรอง ${filename} ใช่หรือไม่? การดำเนินการนี้ไม่สามารถเรียกคืนได้`)) {
      try {
        // ในระบบจริงควรมี API endpoint สำหรับลบไฟล์สำรอง
        // await axios.delete(`${process.env.REACT_APP_API_URL}/system/backups/${id}`);
        
        // อัปเดตรายการไฟล์สำรอง
        setBackups(backups.filter(backup => backup.id !== id));
        toast.success('ลบไฟล์สำรองสำเร็จ');
      } catch (error) {
        console.error('Error deleting backup:', error);
        toast.error('เกิดข้อผิดพลาดในการลบไฟล์สำรอง');
      }
    }
  };

  // ฟังก์ชั่นคืนค่าจากไฟล์สำรอง
  const restoreBackup = (id, filename) => {
    if (window.confirm(`คุณต้องการคืนค่าจากไฟล์สำรอง ${filename} ใช่หรือไม่? ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่`)) {
      try {
        // ในระบบจริงควรมี API endpoint สำหรับคืนค่าจากไฟล์สำรอง
        // await axios.post(`${process.env.REACT_APP_API_URL}/system/backups/${id}/restore`);
        
        toast.info('กำลังคืนค่าจากไฟล์สำรอง กรุณารอสักครู่');
        // จำลองการคืนค่า
        setTimeout(() => {
          toast.success('คืนค่าจากไฟล์สำรองสำเร็จ ระบบจะรีสตาร์ทในอีก 5 วินาที');
        }, 3000);
      } catch (error) {
        console.error('Error restoring backup:', error);
        toast.error('เกิดข้อผิดพลาดในการคืนค่าจากไฟล์สำรอง');
      }
    }
  };

  // ฟังก์ชั่นอัปโหลดไฟล์สำรอง
  const handleUploadBackup = (e) => {
    e.preventDefault();
    toast.info('กำลังอัปโหลดไฟล์สำรอง');
    // ในระบบจริงควรมีการจัดการอัปโหลดไฟล์
    setTimeout(() => {
      toast.success('อัปโหลดไฟล์สำรองสำเร็จ');
      // จำลองการเพิ่มไฟล์ในรายการ
      const now = new Date();
      const newBackup = {
        id: backups.length + 1,
        filename: `backup_imported_${now.getTime()}.sql`,
        size: '122MB',
        created_at: now.toISOString().replace('T', ' ').slice(0, 19),
        status: 'imported'
      };
      setBackups([newBackup, ...backups]);
    }, 2000);
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
        <h1 className="text-2xl font-bold mb-2">จัดการระบบ</h1>
        <p className="text-gray-600">จัดการการสำรองข้อมูล ดูสถานะระบบ และดำเนินการจัดการระบบอื่นๆ</p>
      </div>

      {/* ข้อมูลระบบ */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaInfoCircle className="text-blue-600 mr-2" /> ข้อมูลระบบ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">เวอร์ชันระบบ</p>
            <p className="text-xl font-semibold">{systemInfo.version}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">ขนาดฐานข้อมูล</p>
            <p className="text-xl font-semibold">{systemInfo.dbSize}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">การสำรองข้อมูลล่าสุด</p>
            <p className="text-xl font-semibold">{systemInfo.lastBackup}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">ระยะเวลาให้บริการ</p>
            <p className="text-xl font-semibold">{systemInfo.uptime}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">จำนวนผู้ใช้งาน</p>
            <p className="text-xl font-semibold">{systemInfo.userCount}</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">จำนวนข้อมูลในระบบ</p>
            <p className="text-xl font-semibold">{systemInfo.recordCount}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">การใช้งานทรัพยากร</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">การใช้งานพื้นที่ดิสก์</span>
                <span className="text-sm font-medium">{systemInfo.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${systemInfo.diskUsage > 80 ? 'bg-red-600' : 'bg-blue-600'}`} 
                  style={{ width: `${systemInfo.diskUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">การใช้งานหน่วยความจำ</span>
                <span className="text-sm font-medium">{systemInfo.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-green-600" 
                  style={{ width: `${systemInfo.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">การใช้งาน CPU</span>
                <span className="text-sm font-medium">{systemInfo.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-yellow-600" 
                  style={{ width: `${systemInfo.cpuUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* การจัดการสำรองข้อมูล */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <FaDatabase className="text-blue-600 mr-2" /> การสำรองข้อมูล
          </h2>
          <button
            onClick={createBackup}
            disabled={backupLoading}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {backupLoading ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลใหม่'}
          </button>
        </div>

        {/* อัปโหลดไฟล์สำรอง */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="text-md font-semibold mb-2">อัปโหลดไฟล์สำรอง</h3>
          <form onSubmit={handleUploadBackup} className="flex flex-col md:flex-row items-center gap-2">
            <input
              type="file"
              className="border p-2 rounded-md flex-1"
              accept=".sql,.gz,.zip"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full md:w-auto"
            >
              <FaUpload className="inline mr-2" /> อัปโหลด
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">รองรับไฟล์ .sql, .gz, หรือ .zip (ขนาดสูงสุด 200MB)</p>
        </div>

        {/* รายการไฟล์สำรอง */}
        <div>
          <h3 className="text-md font-semibold mb-2">รายการไฟล์สำรอง</h3>
          {backups.length === 0 ? (
            <p className="text-gray-500">ไม่มีไฟล์สำรองข้อมูล</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">ชื่อไฟล์</th>
                    <th className="px-4 py-2 text-left">ขนาด</th>
                    <th className="px-4 py-2 text-left">วันที่สร้าง</th>
                    <th className="px-4 py-2 text-left">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{backup.filename}</td>
                      <td className="px-4 py-3">{backup.size}</td>
                      <td className="px-4 py-3">{backup.created_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadBackup(backup.filename)}
                            className="text-blue-600 hover:text-blue-900"
                            title="ดาวน์โหลด"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => restoreBackup(backup.id, backup.filename)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="คืนค่าจากไฟล์สำรอง"
                          >
                            <FaCog />
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.id, backup.filename)}
                            className="text-red-600 hover:text-red-900"
                            title="ลบ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* คำเตือนระบบ */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2 flex items-center">
          <FaExclamationTriangle className="text-red-600 mr-2" /> คำเตือนสำคัญ
        </h3>
        <ul className="list-disc list-inside text-red-700 space-y-1">
          <li>การคืนค่าจากไฟล์สำรองจะแทนที่ข้อมูลปัจจุบันทั้งหมด โปรดระมัดระวัง</li>
          <li>ควรสำรองข้อมูลก่อนดำเนินการเปลี่ยนแปลงระบบที่สำคัญ</li>
          <li>ไฟล์สำรองที่อัปโหลดควรมาจากระบบที่เวอร์ชันตรงกัน</li>
          <li>การลบไฟล์สำรองไม่สามารถเรียกคืนได้</li>
        </ul>
      </div>
    </div>
  );
};

export default System;