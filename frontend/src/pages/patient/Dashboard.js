import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  FaWeight,
  FaRulerVertical,
  FaCalendarAlt,
  FaFileMedical,
  FaHistory,
  FaUsers,
} from "react-icons/fa";
import { BsDropletFill } from "react-icons/bs";
import { GiMedicines } from "react-icons/gi";

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [glucoseRecords, setGlucoseRecords] = useState([]);
  const [medications, setMedications] = useState([]);

  // ฟังก์ชันสำหรับดึงข้อมูล patient_id จาก user_id
  const getPatientId = async (userId) => {
    try {
      // ใช้ endpoint /patients/by-user/:userId ที่เราสร้างขึ้นใหม่
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/by-user/${userId}`
      );
      if (response.data) {
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error("Error getting patient ID:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (currentUser && currentUser.id) {
          // ขั้นตอนที่ 1: ดึง patient_id
          const patientId = await getPatientId(currentUser.id);

          if (patientId) {
            setPatientId(patientId);

            // ขั้นตอนที่ 2: ดึงข้อมูลผู้ป่วย
            const patientResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/patients/by-user/${currentUser.id}`
            );
            if (patientResponse.data) {
              setPatientData(patientResponse.data);
            }

            // ขั้นตอนที่ 3: ดึงข้อมูลการนัดหมาย (แก้ไขให้ใช้ endpoint ที่ถูกต้อง)
            // ใช้ endpoint /appointments?upcoming=true&limit=5 ที่มีอยู่แล้ว
            const appointmentsResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/appointments?upcoming=true&limit=5`
            );
            if (appointmentsResponse.data) {
              setAppointments(appointmentsResponse.data);
            }

            // ขั้นตอนที่ 4: ดึงข้อมูลระดับน้ำตาล
            // ตรวจสอบว่ามี endpoint นี้อยู่จริงหรือไม่
            try {
              const glucoseResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/glucose-records?limit=5`
              );
              if (glucoseResponse.data) {
                setGlucoseRecords(glucoseResponse.data);
              }
            } catch (error) {
              console.error("Error fetching glucose records:", error);
              setGlucoseRecords([]);
            }

            // ขั้นตอนที่ 5: ดึงข้อมูลการใช้ยา
            // ตรวจสอบว่ามี endpoint นี้อยู่จริงหรือไม่
            try {
              const medicationsResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/medications?active=true`
              );
              if (medicationsResponse.data) {
                setMedications(medicationsResponse.data);
              }
            } catch (error) {
              console.error("Error fetching medications:", error);
              setMedications([]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // แสดงข้อความถ้าไม่พบข้อมูลผู้ป่วย
  if (!patientData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">
            ไม่พบข้อมูลผู้ป่วย กรุณาติดต่อเจ้าหน้าที่เพื่อลงทะเบียนข้อมูลผู้ป่วย
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">แดชบอร์ด</h1>

      {/* ข้อมูลส่วนตัว */}
      {patientData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaFileMedical className="text-indigo-600 text-xl mr-2" />
              <h2 className="text-lg font-semibold">ข้อมูลการตั้งครรภ์</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">วันกำหนดคลอด</p>
                <p className="font-medium">
                  {patientData.expected_delivery_date
                    ? format(
                        new Date(patientData.expected_delivery_date),
                        "d MMMM yyyy",
                        { locale: th }
                      )
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">อายุครรภ์ตอนวินิจฉัย</p>
                <p className="font-medium">
                  {patientData.gestational_age_at_diagnosis
                    ? `${patientData.gestational_age_at_diagnosis} สัปดาห์`
                    : "ไม่ระบุ"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaHistory className="text-indigo-600 text-xl mr-2" />
              <h2 className="text-lg font-semibold">ประวัติทางการแพทย์</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">กรุ๊ปเลือด</p>
                <p className="font-medium">
                  {patientData.blood_type || "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">
                  เคยเป็นเบาหวานขณะตั้งครรภ์มาก่อน
                </p>
                <p className="font-medium">
                  {patientData.previous_gdm ? "เคย" : "ไม่เคย"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">
                  มีประวัติเบาหวานในครอบครัว
                </p>
                <p className="font-medium">
                  {patientData.family_diabetes_history ? "มี" : "ไม่มี"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-indigo-600 text-xl mr-2" />
              <h2 className="text-lg font-semibold">ข้อมูลทั่วไป</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">ส่วนสูง</p>
                <p className="font-medium">
                  {patientData.height ? `${patientData.height} ซม.` : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">น้ำหนักก่อนตั้งครรภ์</p>
                <p className="font-medium">
                  {patientData.pre_pregnancy_weight
                    ? `${patientData.pre_pregnancy_weight} กก.`
                    : "ไม่ระบุ"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* การนัดหมายที่กำลังจะมาถึง */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <FaCalendarAlt className="inline-block mr-2 text-indigo-600" />
          การนัดหมายที่กำลังจะมาถึง
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {appointments && appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมายเหตุ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(
                          new Date(appointment.appointment_date),
                          "d MMMM yyyy",
                          { locale: th }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.appointment_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.appointment_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.location || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              ไม่มีการนัดหมายที่กำลังจะมาถึง
            </div>
          )}
        </div>
      </div>

      {/* บันทึกระดับน้ำตาลล่าสุด */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <BsDropletFill className="inline-block mr-2 text-indigo-600" />
          บันทึกระดับน้ำตาลล่าสุด
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {glucoseRecords && glucoseRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ช่วงเวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ระดับน้ำตาล (mg/dL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมายเหตุ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {glucoseRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(record.record_date), "d MMMM yyyy", {
                          locale: th,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.record_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.period === "fasting"
                          ? "ก่อนอาหารเช้า (งดอาหาร)"
                          : record.period === "before_breakfast"
                          ? "ก่อนอาหารเช้า"
                          : record.period === "after_breakfast"
                          ? "หลังอาหารเช้า"
                          : record.period === "before_lunch"
                          ? "ก่อนอาหารกลางวัน"
                          : record.period === "after_lunch"
                          ? "หลังอาหารกลางวัน"
                          : record.period === "before_dinner"
                          ? "ก่อนอาหารเย็น"
                          : record.period === "after_dinner"
                          ? "หลังอาหารเย็น"
                          : record.period === "bedtime"
                          ? "ก่อนนอน"
                          : "อื่นๆ"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                            record.glucose_level > 120
                              ? "bg-red-100 text-red-800"
                              : record.glucose_level < 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.glucose_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              ไม่มีบันทึกระดับน้ำตาล
            </div>
          )}
        </div>
      </div>

      {/* รายการยาปัจจุบัน */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <GiMedicines className="inline-block mr-2 text-indigo-600" />
          รายการยาปัจจุบัน
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {medications && medications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อยา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ขนาด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ความถี่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่เริ่ม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่สิ้นสุด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมายเหตุ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medications.map((medication) => (
                    <tr key={medication.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {medication.medication_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {medication.dosage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {medication.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(
                          new Date(medication.start_date),
                          "d MMMM yyyy",
                          {
                            locale: th,
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {medication.end_date
                          ? format(
                              new Date(medication.end_date),
                              "d MMMM yyyy",
                              { locale: th }
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {medication.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              ไม่มีรายการยาในปัจจุบัน
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
