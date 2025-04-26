import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  FaUserCircle,
  FaWeight,
  FaTint,
  FaCalendarAlt,
  FaPills,
  FaStethoscope,
  FaEdit,
  FaPhone,
} from "react-icons/fa";
import { toast } from "react-toastify";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'appointments', 'medications', 'treatments'

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/${id}`
      );
      setPatient(response.data);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      // กรณีไม่พบผู้ป่วย ให้กลับไปยังหน้ารายชื่อผู้ป่วย
      if (error.response && error.response.status === 404) {
        navigate("/nurse/patients");
      }
    } finally {
      setLoading(false);
    }
  };

  // คำนวณอายุจากวันเกิด
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // คำนวณระยะเวลาคงเหลือก่อนคลอด
  const calculateTimeUntilDelivery = (expectedDate) => {
    if (!expectedDate) return null;

    const today = new Date();
    const deliveryDate = new Date(expectedDate);
    const diffTime = deliveryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "คลอดแล้ว";

    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return `${weeks} สัปดาห์ ${days} วัน`;
  };

  // คำนวณค่า BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // แปลผล BMI
  const getBMICategory = (bmi) => {
    if (!bmi) return "";

    const bmiFmt = parseFloat(bmi);
    if (bmiFmt < 18.5) return "น้ำหนักน้อย";
    if (bmiFmt < 25) return "น้ำหนักปกติ";
    if (bmiFmt < 30) return "น้ำหนักเกิน";
    return "อ้วน";
  };

  // สีของสถานะ BMI
  const getBMIColorClass = (bmi) => {
    if (!bmi) return "text-gray-500";

    const bmiFmt = parseFloat(bmi);
    if (bmiFmt < 18.5) return "text-yellow-500";
    if (bmiFmt < 25) return "text-green-500";
    if (bmiFmt < 30) return "text-orange-500";
    return "text-red-500";
  };

  // จัดการเปลี่ยนแท็บ
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // จัดการโทรหาผู้ป่วย
  const handleCallPatient = () => {
    if (patient && patient.phone) {
      window.location.href = `tel:${patient.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-xl text-gray-600 mb-4">ไม่พบข้อมูลผู้ป่วย</p>
          <Link
            to="/nurse/patients"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            กลับไปยังรายชื่อผู้ป่วย
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ส่วนหัวข้อมูลผู้ป่วย */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex items-start">
            <div className="rounded-full bg-purple-100 p-3 text-purple-600 mr-4">
              <FaUserCircle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600">
                {patient.hospital_id} | อายุ:{" "}
                {calculateAge(patient.date_of_birth)} ปี | กรุ๊ปเลือด:{" "}
                {patient.blood_type || "ไม่ระบุ"}
              </p>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={handleCallPatient}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <FaPhone className="mr-1" /> โทร
            </button>
            <Link
              to={`/nurse/patients/${id}/glucose`}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <FaTint className="mr-1" /> ดูค่าน้ำตาล
            </Link>
            <Link
              to={`/nurse/patients/${id}/treatments`}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <FaStethoscope className="mr-1" /> การรักษา
            </Link>
          </div>
        </div>
      </div>

      {/* แท็บเมนู */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto">
          <button
            className={`py-3 px-6 ${
              activeTab === "overview"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleTabChange("overview")}
          >
            ภาพรวม
          </button>
          <button
            className={`py-3 px-6 ${
              activeTab === "appointments"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleTabChange("appointments")}
          >
            การนัดหมาย
          </button>
          <button
            className={`py-3 px-6 ${
              activeTab === "medications"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleTabChange("medications")}
          >
            ยาที่ได้รับ
          </button>
          <button
            className={`py-3 px-6 ${
              activeTab === "treatments"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleTabChange("treatments")}
          >
            ประวัติการรักษา
          </button>
        </div>
      </div>

      {/* เนื้อหาของแท็บภาพรวม */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ข้อมูลทั่วไป */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              ข้อมูลทั่วไป
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">วันเกิด</p>
                <p className="font-medium">
                  {patient.date_of_birth
                    ? format(new Date(patient.date_of_birth), "d MMMM yyyy", {
                        locale: th,
                      })
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">ที่อยู่</p>
                <p className="font-medium">{patient.address || "ไม่ระบุ"}</p>
              </div>
              <div>
                <p className="text-gray-600">เบอร์โทรศัพท์</p>
                <p className="font-medium">{patient.phone || "ไม่ระบุ"}</p>
              </div>
              <div>
                <p className="text-gray-600">ความสูง</p>
                <p className="font-medium">
                  {patient.height ? `${patient.height} ซม.` : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  มีประวัติเบาหวานขณะตั้งครรภ์มาก่อน
                </p>
                <p className="font-medium">
                  {patient.previous_gdm ? "ใช่" : "ไม่ใช่"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">มีประวัติเบาหวานในครอบครัว</p>
                <p className="font-medium">
                  {patient.family_diabetes_history ? "ใช่" : "ไม่ใช่"}
                </p>
              </div>
            </div>
          </div>

          {/* ข้อมูลการตั้งครรภ์ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              ข้อมูลการตั้งครรภ์
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">วันกำหนดคลอด</p>
                <p className="font-medium">
                  {patient.expected_delivery_date
                    ? format(
                        new Date(patient.expected_delivery_date),
                        "d MMMM yyyy",
                        { locale: th }
                      )
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">ระยะเวลาก่อนคลอด</p>
                <p className="font-medium">
                  {patient.expected_delivery_date
                    ? calculateTimeUntilDelivery(patient.expected_delivery_date)
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">อายุครรภ์ตอนวินิจฉัย</p>
                <p className="font-medium">
                  {patient.gestational_age_at_diagnosis
                    ? `${patient.gestational_age_at_diagnosis} สัปดาห์`
                    : "ไม่ระบุ"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">น้ำหนักก่อนตั้งครรภ์</p>
                <p className="font-medium">
                  {patient.pre_pregnancy_weight
                    ? `${patient.pre_pregnancy_weight} กก.`
                    : "ไม่ระบุ"}
                </p>
              </div>
              {patient.latest_weight && (
                <>
                  <div>
                    <p className="text-gray-600">น้ำหนักล่าสุด</p>
                    <p className="font-medium">
                      {patient.latest_weight.weight} กก.
                      <span className="text-sm text-gray-500 ml-2">
                        (บันทึกเมื่อ{" "}
                        {format(
                          new Date(patient.latest_weight.record_date),
                          "d MMM yyyy",
                          { locale: th }
                        )}
                        )
                      </span>
                    </p>
                  </div>
                  {patient.pre_pregnancy_weight && (
                    <div>
                      <p className="text-gray-600">น้ำหนักที่เพิ่มขึ้น</p>
                      <p className="font-medium">
                        {(
                          patient.latest_weight.weight -
                          patient.pre_pregnancy_weight
                        ).toFixed(1)}{" "}
                        กก.
                      </p>
                    </div>
                  )}
                  {patient.height && (
                    <div>
                      <p className="text-gray-600">BMI ปัจจุบัน</p>
                      <p
                        className={`font-medium ${getBMIColorClass(
                          calculateBMI(
                            patient.latest_weight.weight,
                            patient.height
                          )
                        )}`}
                      >
                        {calculateBMI(
                          patient.latest_weight.weight,
                          patient.height
                        )}
                        <span className="ml-1">
                          (
                          {getBMICategory(
                            calculateBMI(
                              patient.latest_weight.weight,
                              patient.height
                            )
                          )}
                          )
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* เป้าหมายระดับน้ำตาล */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold">เป้าหมายระดับน้ำตาล</h2>
              <Link
                to={`/nurse/patients/${id}/treatments`}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                ตั้งค่าเป้าหมาย
              </Link>
            </div>
            {patient.glucose_targets && patient.glucose_targets.length > 0 ? (
              <div className="space-y-4">
                {patient.glucose_targets.map((target, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{target.target_type}</p>
                    <p className="text-gray-600">
                      {target.min_value} - {target.max_value} mg/dL
                    </p>
                    <p className="text-xs text-gray-500">
                      ตั้งค่าเมื่อ{" "}
                      {format(new Date(target.effective_date), "d MMM yyyy", {
                        locale: th,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                ยังไม่ได้ตั้งค่าเป้าหมายระดับน้ำตาล
              </p>
            )}
          </div>

          {/* การนัดหมายที่กำลังจะมาถึง */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold">
                การนัดหมายที่กำลังจะมาถึง
              </h2>
              <button
                className="text-sm text-purple-600 hover:text-purple-800"
                onClick={() => handleTabChange("appointments")}
              >
                ดูทั้งหมด
              </button>
            </div>
            {patient.upcoming_appointments &&
            patient.upcoming_appointments.length > 0 ? (
              <div className="space-y-3">
                {patient.upcoming_appointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-purple-500 pl-3 py-2"
                  >
                    <p className="font-medium">
                      {appointment.appointment_type}
                    </p>
                    <p className="text-gray-600">
                      {format(
                        new Date(appointment.appointment_date),
                        "d MMM yyyy",
                        { locale: th }
                      )}{" "}
                      {format(
                        new Date(`2000-01-01T${appointment.appointment_time}`),
                        "HH:mm น."
                      )}
                    </p>
                    {appointment.location && (
                      <p className="text-sm text-gray-500">
                        {appointment.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">ไม่มีการนัดหมายที่กำลังจะมาถึง</p>
            )}
          </div>
        </div>
      )}

      {/* เนื้อหาของแท็บการนัดหมาย */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">รายการนัดหมาย</h2>
            <Link
              to="/appointments/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <FaCalendarAlt className="inline mr-1" /> นัดหมายใหม่
            </Link>
          </div>

          {patient.upcoming_appointments &&
          patient.upcoming_appointments.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">
                การนัดหมายที่กำลังจะมาถึง
              </h3>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patient.upcoming_appointments.map((appointment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(
                            new Date(appointment.appointment_date),
                            "d MMM yyyy",
                            { locale: th }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(
                            new Date(
                              `2000-01-01T${appointment.appointment_time}`
                            ),
                            "HH:mm น."
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.appointment_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.location || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {appointment.notes || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <FaEdit className="inline" /> แก้ไข
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mb-8">ไม่มีการนัดหมายที่กำลังจะมาถึง</p>
          )}

          <h3 className="text-lg font-medium mb-4">ประวัติการนัดหมาย</h3>
          <p className="text-gray-500">ไม่มีประวัติการนัดหมายที่ผ่านมา</p>
        </div>
      )}

      {/* เนื้อหาของแท็บยาที่ได้รับ */}
      {activeTab === "medications" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">รายการยาที่ได้รับ</h2>
            <Link
              to={`/nurse/patients/${id}/treatments`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <FaPills className="inline mr-1" /> เพิ่มยาใหม่
            </Link>
          </div>

          {patient.medications && patient.medications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อยา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ขนาดยา
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
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patient.medications.map((medication, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {medication.medication_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medication.dosage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medication.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(medication.start_date), "d MMM yyyy", {
                          locale: th,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medication.end_date
                          ? format(
                              new Date(medication.end_date),
                              "d MMM yyyy",
                              { locale: th }
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            medication.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {medication.is_active ? "ใช้งานอยู่" : "สิ้นสุดแล้ว"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <FaEdit className="inline" /> แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">ไม่พบข้อมูลการใช้ยา</p>
          )}
        </div>
      )}

      {/* เนื้อหาของแท็บประวัติการรักษา */}
      {activeTab === "treatments" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ประวัติการรักษา</h2>

          <Link
            to={`/nurse/patients/${id}/treatments`}
            className="inline-block px-4 py-2 mb-6 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <FaStethoscope className="inline mr-1" /> เพิ่มการรักษาใหม่
          </Link>

          <div className="space-y-6">
            {/* ข้อมูลจำลองประวัติการรักษา - ในระบบจริงควรดึงจาก API */}
            <div className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-lg">ให้คำปรึกษาโภชนาการ</h3>
                  <p className="text-gray-500">
                    {format(new Date("2023-12-15"), "d MMM yyyy", {
                      locale: th,
                    })}
                  </p>
                  <p className="mt-2">
                    แนะนำให้ลดอาหารที่มีน้ำตาลสูง
                    และเพิ่มการทานผักและโปรตีนมากขึ้น
                  </p>
                </div>
                <div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <FaEdit />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                โดย: พยาบาล สมศรี จริงใจ
              </p>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-lg">ปรับแผนการรักษา</h3>
                  <p className="text-gray-500">
                    {format(new Date("2023-12-01"), "d MMM yyyy", {
                      locale: th,
                    })}
                  </p>
                  <p className="mt-2">
                    ปรับแผนการรักษาเนื่องจากค่าน้ำตาลค่อนข้างสูงในช่วงที่ผ่านมา
                    แนะนำให้ควบคุมอาหารเพิ่มเติมและให้จดบันทึกอาหารอย่างละเอียด
                  </p>
                </div>
                <div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <FaEdit />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                โดย: พยาบาล สมศรี จริงใจ
              </p>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-lg">
                    วินิจฉัยเบาหวานขณะตั้งครรภ์
                  </h3>
                  <p className="text-gray-500">
                    {format(new Date("2023-11-15"), "d MMM yyyy", {
                      locale: th,
                    })}
                  </p>
                  <p className="mt-2">
                    ผู้ป่วยได้รับการวินิจฉัยว่าเป็นเบาหวานขณะตั้งครรภ์จากการตรวจ
                    OGTT 75g พบค่าน้ำตาลหลังงดอาหาร 95 mg/dL และหลังทานน้ำตาล 1
                    ชั่วโมง 190 mg/dL และ 2 ชั่วโมง 168 mg/dL
                  </p>
                </div>
                <div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <FaEdit />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                โดย: แพทย์ วีระ ปรีชา
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
