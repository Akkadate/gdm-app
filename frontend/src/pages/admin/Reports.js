// src/pages/admin/Reports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilePdf, FaFileExcel, FaChartLine, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // ต้นเดือนปัจจุบัน
    endDate: new Date().toISOString().split('T')[0] // วันปัจจุบัน
  });
  const [reportData, setReportData] = useState(null);

  // รายงานที่มีให้เลือก
  const reportTypes = [
    { value: 'summary', label: 'รายงานสรุปภาพรวม', icon: <FaChartLine className="text-blue-500" /> },
    { value: 'patients', label: 'รายงานผู้ป่วยทั้งหมด', icon: <FaChartLine className="text-green-500" /> },
    { value: 'glucoseOutOfRange', label: 'รายงานผู้ป่วยที่มีค่าน้ำตาลผิดปกติ', icon: <FaChartLine className="text-red-500" /> },
    { value: 'activity', label: 'รายงานกิจกรรมในระบบ', icon: <FaChartLine className="text-purple-500" /> },
    { value: 'appointments', label: 'รายงานการนัดหมาย', icon: <FaChartLine className="text-yellow-500" /> }
  ];

  // ดึงข้อมูลรายงานจาก API
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // ในระบบจริงควรมี API endpoint สำหรับดึงข้อมูลรายงานแต่ละประเภท
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reports/${reportType}`,
        { params: dateRange }
      );
      setReportData(response.data);
      toast.success('ดึงข้อมูลรายงานสำเร็จ');
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
      
      // กรณีไม่มี API สำหรับข้อมูลนี้ยังคงแสดงข้อมูลตัวอย่าง
      if (reportType === 'summary') {
        setReportData({
          patientCount: 42,
          nurseCount: 8,
          appointmentCount: 120,
          totalGlucoseReadings: 2580,
          abnormalGlucoseReadings: 320,
          averageReadingsPerPatient: 61.4,
          activePatients: 38,
          totalMealLogs: 1842,
          totalActivityLogs: 920,
          period: {
            start: dateRange.startDate,
            end: dateRange.endDate
          },
          glucoseData: {
            labels: ['January', 'February', 'March', 'April', 'May'],
            datasets: [
              {
                label: 'ค่าเฉลี่ยน้ำตาลในเลือด (mg/dL)',
                data: [110, 120, 115, 105, 100],
              }
            ]
          }
        });
      } else {
        // ข้อมูลตัวอย่างสำหรับรายงานอื่นๆ
        setReportData({
          period: {
            start: dateRange.startDate,
            end: dateRange.endDate
          },
          message: `ข้อมูลตัวอย่างสำหรับรายงาน ${reportType}`,
          count: Math.floor(Math.random() * 100) + 10
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // สร้างรายงาน
  const generateReport = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  // ดาวน์โหลดรายงานในรูปแบบต่างๆ
  const downloadReport = (format) => {
    if (!reportData) {
      toast.error('ไม่มีข้อมูลรายงาน กรุณาสร้างรายงานก่อน');
      return;
    }

    // ในระบบจริงควรส่งคำขอไปยัง API เพื่อดาวน์โหลดไฟล์
    toast.info(`กำลังดาวน์โหลดรายงานในรูปแบบ ${format === 'pdf' ? 'PDF' : 'Excel'}`);
    
    // จำลองการดาวน์โหลด (ในระบบจริงควรใช้การดาวน์โหลดไฟล์จริง)
    setTimeout(() => {
      toast.success(`ดาวน์โหลดรายงานในรูปแบบ ${format === 'pdf' ? 'PDF' : 'Excel'} สำเร็จ`);
    }, 1500);
  };

  // แสดงผลข้อมูลรายงานตามประเภท
  const renderReportData = () => {
    if (!reportData) return null;

    if (reportType === 'summary') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">ข้อมูลทั่วไป</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนผู้ป่วยทั้งหมด:</span>
                <span className="font-medium">{reportData.patientCount} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนพยาบาลทั้งหมด:</span>
                <span className="font-medium">{reportData.nurseCount} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนการนัดหมายทั้งหมด:</span>
                <span className="font-medium">{reportData.appointmentCount} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ผู้ป่วยที่ยังรักษาอยู่:</span>
                <span className="font-medium">{reportData.activePatients} คน</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">ข้อมูลการบันทึกค่าน้ำตาล</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนการบันทึกทั้งหมด:</span>
                <span className="font-medium">{reportData.totalGlucoseReadings} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ค่าน้ำตาลผิดปกติ:</span>
                <span className="font-medium">{reportData.abnormalGlucoseReadings} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ค่าเฉลี่ยการบันทึกต่อผู้ป่วย:</span>
                <span className="font-medium">{reportData.averageReadingsPerPatient} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">อัตราค่าน้ำตาลผิดปกติ:</span>
                <span className="font-medium">{((reportData.abnormalGlucoseReadings / reportData.totalGlucoseReadings) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">ข้อมูลการใช้งานอื่นๆ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-1">การบันทึกอาหาร</p>
                <p className="text-2xl font-bold">{reportData.totalMealLogs}</p>
                <p className="text-sm text-gray-500">รายการ</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-1">การบันทึกกิจกรรม</p>
                <p className="text-2xl font-bold">{reportData.totalActivityLogs}</p>
                <p className="text-sm text-gray-500">รายการ</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-1">ช่วงเวลารายงาน</p>
                <p className="text-xl font-bold">
                  {new Date(reportData.period.start).toLocaleDateString('th-TH')} - {new Date(reportData.period.end).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // แสดงผลข้อมูลตัวอย่างสำหรับรายงานอื่นๆ
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">ข้อมูลรายงาน {reportTypes.find(r => r.value === reportType)?.label}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ช่วงเวลา:</span>
              <span className="font-medium">
                {new Date(reportData.period.start).toLocaleDateString('th-TH')} - {new Date(reportData.period.end).toLocaleDateString('th-TH')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">จำนวนรายการ:</span>
              <span className="font-medium">{reportData.count}</span>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg mt-4">
              <p className="text-gray-600">ในระบบจริงจะแสดงข้อมูลตามรายงานที่เลือก</p>
              <p className="text-gray-600">{reportData.message}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">รายงาน</h1>
        <p className="text-gray-600">สร้างและดาวน์โหลดรายงานสำหรับระบบ</p>
      </div>

      {/* แบบฟอร์มสร้างรายงาน */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={generateReport}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทรายงาน</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                disabled={loading}
              >
                {loading ? 'กำลังดึงข้อมูล...' : 'สร้างรายงาน'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ส่วนแสดงผลรายงาน */}
      {reportData && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ผลลัพธ์รายงาน</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadReport('pdf')}
                className="flex items-center bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                <FaFilePdf className="mr-2" /> ดาวน์โหลด PDF
              </button>
              <button
                onClick={() => downloadReport('excel')}
                className="flex items-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <FaFileExcel className="mr-2" /> ดาวน์โหลด Excel
              </button>
            </div>
          </div>
          
          {renderReportData()}
        </div>
      )}

      {/* คำแนะนำการใช้งานรายงาน */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-semibold mb-2">คำแนะนำการใช้งาน</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>เลือกประเภทรายงานที่ต้องการจากรายการที่มีให้</li>
          <li>กำหนดช่วงวันที่ต้องการดูข้อมูล</li>
          <li>กดปุ่ม "สร้างรายงาน" เพื่อดูข้อมูลรายงานตามเงื่อนไขที่เลือก</li>
          <li>สามารถดาวน์โหลดรายงานในรูปแบบ PDF หรือ Excel ได้</li>
          <li>รายงานที่สร้างจะแสดงข้อมูลตามช่วงเวลาที่กำหนดเท่านั้น</li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;