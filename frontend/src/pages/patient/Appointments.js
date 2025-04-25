import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { FaCalendarAlt, FaMap, FaCheck, FaClock } from "react-icons/fa";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' or 'past'

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/appointments?${activeTab}=true`
      );
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // แปลงประเภทการนัดหมาย
  const getAppointmentTypeLabel = (type) => {
    const typeMap = {
      checkup: "ตรวจครรภ์",
      glucose: "ตรวจระดับน้ำตาล",
      ultrasound: "อัลตราซาวด์",
      nutrition: "ให้คำปรึกษาโภชนาการ",
      examination: "ตรวจร่างกาย",
      other: "อื่นๆ",
    };
    return typeMap[type] || type;
  };

  // แยกการนัดหมายตามเดือน (สำหรับการแสดงผลที่ดีกว่า)
  const groupAppointmentsByMonth = () => {
    const grouped = {};

    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointment_date);
      const monthYear = format(date, "MMMM yyyy", { locale: th });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(appointment);
    });

    // เรียงตามเดือน
    return Object.entries(grouped).sort((a, b) => {
      // เรียงจากเดือนปัจจุบันไปอนาคต สำหรับการนัดหมายที่กำลังจะมาถึง
      // หรือเรียงจากเดือนล่าสุดไปอดีต สำหรับการนัดหมายที่ผ่านมาแล้ว
      const dateA = new Date(a[1][0].appointment_date);
      const dateB = new Date(b[1][0].appointment_date);
      return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
    });
  };

  // เรียงการนัดหมายตามวันที่ภายในเดือนเดียวกัน
  const sortAppointmentsByDate = (appointments) => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(a.appointment_date);
      const dateB = new Date(b.appointment_date);
      if (dateA.getTime() === dateB.getTime()) {
        // หากวันที่เดียวกัน ให้เรียงตามเวลา
        return a.appointment_time.localeCompare(b.appointment_time);
      }
      return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
    });
  };

  // สีของประเภทการนัดหมาย
  const getAppointmentColor = (type) => {
    const colorMap = {
      checkup: "blue",
      glucose: "green",
      ultrasound: "purple",
      nutrition: "yellow",
      examination: "red",
      other: "gray",
    };
    return colorMap[type] || "indigo";
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">การนัดหมาย</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "upcoming"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            การนัดหมายที่กำลังจะมาถึง
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "past"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("past")}
          >
            ประวัติการนัดหมาย
          </button>
        </div>
      </div>

      {/* รายการนัดหมาย */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-5xl mb-4">
              <FaCalendarAlt className="inline-block" />
            </div>
            <p className="text-gray-500">
              {activeTab === "upcoming"
                ? "ไม่มีการนัดหมายที่กำลังจะมาถึง"
                : "ไม่พบประวัติการนัดหมาย"}
            </p>
          </div>
        ) : (
          groupAppointmentsByMonth().map(([month, monthAppointments]) => (
            <div key={month} className="mb-6">
              <h3 className="text-lg font-medium mb-4 border-b pb-2">
                {month}
              </h3>

              <div className="space-y-4">
                {sortAppointmentsByDate(monthAppointments).map(
                  (appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div
                        className={`w-1 h-full absolute left-0 bg-${getAppointmentColor(
                          appointment.appointment_type
                        )}-500 rounded-l-lg`}
                      ></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium">
                            {getAppointmentTypeLabel(
                              appointment.appointment_type
                            )}
                          </h4>
                          <div className="mt-2 flex items-center text-gray-500">
                            <FaCalendarAlt className="mr-2" />
                            {format(
                              new Date(appointment.appointment_date),
                              "EEEE d MMMM yyyy",
                              { locale: th }
                            )}
                          </div>
                          <div className="mt-1 flex items-center text-gray-500">
                            <FaClock className="mr-2" />
                            {format(
                              new Date(
                                `2000-01-01T${appointment.appointment_time}`
                              ),
                              "HH:mm น."
                            )}
                          </div>
                          {appointment.location && (
                            <div className="mt-1 flex items-center text-gray-500">
                              <FaMap className="mr-2" />
                              {appointment.location}
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="mt-2 text-gray-600">
                              <p>{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                        {/* Status label */}
                        {activeTab === "past" && (
                          <div
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              appointment.is_completed
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {appointment.is_completed ? (
                              <>
                                <FaCheck className="inline-block mr-1" />
                                เสร็จสิ้น
                              </>
                            ) : (
                              "ไม่ได้เข้ารับการตรวจ"
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* คำแนะนำเพิ่มเติม */}
      <div className="bg-indigo-50 rounded-lg p-4 mt-6">
        <h2 className="text-lg font-medium text-indigo-800 mb-2">
          คำแนะนำเกี่ยวกับการนัดหมาย
        </h2>
        <ul className="list-disc pl-5 text-indigo-600">
          <li className="mb-1">
            กรุณามาตามเวลานัดหมาย และควรมาก่อนเวลานัด 15-30 นาที
          </li>
          <li className="mb-1">
            หากไม่สามารถมาตามนัดได้ กรุณาแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง
          </li>
          <li className="mb-1">
            นำสมุดบันทึกประจำตัวผู้ป่วย และบัตรนัดมาด้วยทุกครั้ง
          </li>
          <li className="mb-1">
            งดอาหารและเครื่องดื่ม (ยกเว้นน้ำเปล่า) อย่างน้อย 8-10
            ชั่วโมงก่อนการตรวจเลือด
          </li>
        </ul>
        <p className="mt-3 text-sm text-indigo-700">
          หากมีข้อสงสัยเกี่ยวกับการนัดหมาย กรุณาติดต่อเจ้าหน้าที่ที่หมายเลข{" "}
          <span className="font-medium">02-123-4567</span>
        </p>
      </div>
    </div>
  );
};

export default Appointments;
