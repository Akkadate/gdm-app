import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  FaUserInjured,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";
import { API_URL } from "../../config";

const NurseDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todayDate, setTodayDate] = useState(
    format(new Date(), "d MMMM yyyy", { locale: th })
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/patients/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันคำนวณเวลาที่ผ่านไปตั้งแต่การอ่านค่าล่าสุด
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "ไม่ถึง 1 ชั่วโมง";
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} วันที่แล้ว`;
    }
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
      <h1 className="text-2xl font-bold mb-6">แดชบอร์ดพยาบาล</h1>

      {/* วันที่วันนี้ */}
      <div className="mb-6">
        <p className="text-lg">วันที่: {todayDate}</p>
      </div>

      {/* สรุปสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* จำนวนผู้ป่วยทั้งหมด */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FaUserInjured className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">จำนวนผู้ป่วยทั้งหมด</p>
            <p className="text-2xl font-bold">
              {dashboardData?.totalPatients || 0} คน
            </p>
          </div>
        </div>

        {/* จำนวนผู้ป่วยที่ต้องติดตาม */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">ผู้ป่วยที่ต้องติดตาม</p>
            <p className="text-2xl font-bold">
              {dashboardData?.abnormalPatients?.length || 0} คน
            </p>
          </div>
        </div>

        {/* การนัดหมายวันนี้ */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaCalendarAlt className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">การนัดหมายวันนี้</p>
            <p className="text-2xl font-bold">
              {dashboardData?.todayAppointments || 0} รายการ
            </p>
          </div>
        </div>
      </div>

      {/* ผู้ป่วยที่ต้องติดตาม */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            ผู้ป่วยที่มีค่าน้ำตาลผิดปกติ
          </h2>
          <Link
            to="/nurse/patients"
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            ดูผู้ป่วยทั้งหมด
          </Link>
        </div>

        {dashboardData?.abnormalPatients?.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">
            ไม่มีผู้ป่วยที่มีค่าน้ำตาลผิดปกติในขณะนี้
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขประจำตัว
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนครั้งที่ผิดปกติ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การอ่านค่าล่าสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.abnormalPatients?.map((patient) => (
                  <tr key={patient.hospital_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.hospital_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {patient.abnormal_count} ครั้ง
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(patient.latest_reading)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/nurse/patients/${patient.id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        ดูข้อมูล
                      </Link>
                      <Link
                        to={`/nurse/patients/${patient.id}/glucose`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดูค่าน้ำตาล
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ข้อมูลสรุป */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ค่าเฉลี่ยน้ำตาลเฉลี่ยของผู้ป่วยทั้งหมด */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <FaChartLine className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                ค่าน้ำตาลเฉลี่ยของผู้ป่วย (7 วันล่าสุด)
              </h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">
                {dashboardData?.weeklyAverageGlucose || 0}
              </p>
              <p className="text-gray-500 mt-1">mg/dL</p>
            </div>
          </div>
        </div>

        {/* การนัดหมายที่กำลังจะมาถึง */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">การนัดหมายวันนี้</h2>
            <Link
              to="/nurse/appointments"
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              ดูทั้งหมด
            </Link>
          </div>

          {dashboardData?.todayAppointments === 0 ? (
            <p className="text-gray-500 py-4 text-center">
              ไม่มีการนัดหมายสำหรับวันนี้
            </p>
          ) : (
            <div className="space-y-4">
              {/* จำลองข้อมูลการนัดหมาย */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">คุณสมศรี สมใจ</p>
                <p className="text-sm text-gray-500">
                  เวลา 09:30 น. - ตรวจครรภ์ประจำเดือน
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">คุณวิมล ใจดี</p>
                <p className="text-sm text-gray-500">
                  เวลา 13:00 น. - ตรวจระดับน้ำตาล
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">คุณพรทิพย์ สุขสบาย</p>
                <p className="text-sm text-gray-500">
                  เวลา 15:30 น. - ให้คำปรึกษาโภชนาการ
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ข้อแนะนำ */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">ข้อแนะนำประจำวัน</h2>
        <div className="space-y-4">
          {dashboardData?.abnormalPatients?.length > 0 ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    มีผู้ป่วย {dashboardData.abnormalPatients.length}{" "}
                    รายที่มีค่าน้ำตาลผิดปกติ กรุณาตรวจสอบและติดต่อผู้ป่วยโดยด่วน
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaChartLine className="text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    ไม่มีผู้ป่วยที่มีค่าน้ำตาลผิดปกติในขณะนี้
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaCalendarAlt className="text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  คุณมี {dashboardData?.todayAppointments || 0}{" "}
                  การนัดหมายสำหรับวันนี้ กรุณาตรวจสอบตารางการนัดหมาย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
