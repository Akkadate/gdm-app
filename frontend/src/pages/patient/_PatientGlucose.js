import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-toastify";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaUserCircle,
  FaWeight,
  FaTint,
  FaCalendarAlt,
  FaNotesMedical,
  FaPills,
  FaChartLine,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaFileMedical,
} from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [glucoseReadings, setGlucoseReadings] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, glucose, weight, appointments, treatments, medications

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  // ดึงข้อมูลผู้ป่วย
  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลผู้ป่วย
      const patientResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/${id}`
      );
      setPatient(patientResponse.data);

      // ดึงข้อมูลค่าน้ำตาล 30 วันล่าสุด
      const glucoseResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/glucose?patient_id=${id}&days=30`
      );
      setGlucoseReadings(glucoseResponse.data);

      // ดึงข้อมูลน้ำหนัก
      const weightResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/weights?patient_id=${id}`
      );
      setWeightRecords(weightResponse.data);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย");
    } finally {
      setLoading(false);
    }
  };

  // เตรียมข้อมูลสำหรับกราฟค่าน้ำตาล
  const prepareGlucoseChartData = () => {
    // เรียงข้อมูลตามวันที่
    const sortedReadings = [...glucoseReadings].sort(
      (a, b) => new Date(a.reading_date) - new Date(b.reading_date)
    );

    // จัดกลุ่มข้อมูลตามวันที่
    const dateGroups = {};
    sortedReadings.forEach((reading) => {
      if (!dateGroups[reading.reading_date]) {
        dateGroups[reading.reading_date] = [];
      }
      dateGroups[reading.reading_date].push(reading);
    });

    // สร้างข้อมูลค่าเฉลี่ยต่อวัน
    const labels = Object.keys(dateGroups).map((date) =>
      format(new Date(date), "d MMM", { locale: th })
    );
    const averageValues = Object.values(dateGroups).map((dayReadings) => {
      const sum = dayReadings.reduce(
        (total, reading) => total + Number(reading.glucose_value),
        0
      );
      return sum / dayReadings.length;
    });

    return {
      labels,
      datasets: [
        {
          label: "ค่าเฉลี่ยน้ำตาลในเลือด (mg/dL)",
          data: averageValues,
          fill: false,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.3,
        },
      ],
    };
  };

  // เตรียมข้อมูลสำหรับกราฟน้ำหนัก
  const prepareWeightChartData = () => {
    // เรียงข้อมูลตามวันที่
    const sortedWeights = [...weightRecords].sort(
      (a, b) => new Date(a.record_date) - new Date(b.record_date)
    );

    return {
      labels: sortedWeights.map((weight) =>
        format(new Date(weight.record_date), "d MMM", { locale: th })
      ),
      datasets: [
        {
          label: "น้ำหนัก (กก.)",
          data: sortedWeights.map((weight) => weight.weight),
          fill: false,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          tension: 0.3,
        },
      ],
    };
  };

  const glucoseChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "แนวโน้มค่าน้ำตาลในเลือด 30 วันล่าสุด",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        suggestedMin: 60,
        suggestedMax: 200,
      },
    },
  };

  const weightChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "แนวโน้มน้ำหนัก",
      },
    },
  };

  // แปลงประเภทการตรวจค่าน้ำตาล
  const translateReadingType = (type) => {
    const typeMap = {
      before_breakfast: "ก่อนอาหารเช้า",
      after_breakfast: "หลังอาหารเช้า",
      before_lunch: "ก่อนอาหารกลางวัน",
      after_lunch: "หลังอาหารกลางวัน",
      before_dinner: "ก่อนอาหารเย็น",
      after_dinner: "หลังอาหารเย็น",
      bedtime: "ก่อนนอน",
    };
    return typeMap[type] || type;
  };

  // คำนวณอายุจากวันเกิด
  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return `${age} ปี`;
  };

  // ตรวจสอบว่าค่าน้ำตาลอยู่ในเกณฑ์ปกติหรือไม่
  const getGlucoseStatusClass = (value, type) => {
    if (patient && patient.glucose_targets && patient.glucose_targets.length > 0) {
      const targetType = type.includes("after") ? "หลังอาหาร" : "ก่อนอาหาร";
      const target = patient.glucose_targets.find(
        (t) => t.target_type === targetType
      );

      if (target) {
        if (value < target.min_value) return "text-yellow-500";
        if (value > target.max_value) return "text-red-500";
        return "text-green-500";
      }
    }

    // กรณีไม่มีเป้าหมายเฉพาะ ใช้เกณฑ์ทั่วไป
    if (type.includes("after")) {
      // หลังอาหาร
      if (value < 70) return "text-yellow-500";
      if (value > 120) return "text-red-500";
    } else {
      // ก่อนอาหาร หรือก่อนนอน
      if (value < 70) return "text-yellow-500";
      if (value > 95) return "text-red-500";
    }

    return "text-green-500";
  };

  // คำนวณค่า BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
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
      <div className="min-h-screen flex flex-col justify-center items-center">
        <p className="text-xl font-semibold text-red-500 mb-4">
          ไม่พบข้อมูลผู้ป่วย
        </p>
        <button
          onClick={() => navigate("/nurse/patients")}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          กลับไปหน้ารายชื่อผู้ป่วย
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* หัวข้อและลิงก์กลับ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          ข้อมูลผู้ป่วย: {patient.first_name} {patient.last_name}
        </h1>
        <Link
          to="/nurse/patients"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          กลับไปหน้ารายชื่อผู้ป่วย
        </Link>
      </div>

      {/* ข้อมูลสรุปผู้ป่วย */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* ข้อมูลส่วนตัว */}
          <div className="md:w-1/3">
            <div className="flex items-center mb-4">
              <FaUserCircle className="text-4xl text-purple-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold">
                  {patient.first_name} {patient.last_name}
                </h2>
                <p className="text-gray-500">
                  HN: {patient.hospital_id} | {calculateAge(patient.date_of_birth)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <FaPhone className="text-purple-600 mt-1 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                  <p>{patient.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FaCalendarAlt className="text-purple-600 mt-1 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">วันที่กำหนดคลอด</p>
                  <p>
                    {patient.expected_delivery_date
                      ? format(
                          new Date(patient.expected_delivery_date),
                          "d MMMM yyyy",
                          { locale: th }
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลตั้งครรภ์และสุขภาพ */}
          <div className="md:w-1/3">
            <h3 className="font-semibold text-lg mb-3">ข้อมูลตั้งครรภ์</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-500 w-44">อายุครรภ์ตอนวินิจฉัย:</span>
                <span>
                  {patient.gestational_age_at_diagnosis
                    ? `${patient.gestational_age_at_diagnosis} สัปดาห์`
                    : "-"}
                </span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-44">น้ำหนักก่อนตั้งครรภ์:</span>
                <span>
                  {patient.pre_pregnancy_weight
                    ? `${patient.pre_pregnancy_weight} กก.`
                    : "-"}
                </span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-44">ส่วนสูง:</span>
                <span>{patient.height ? `${patient.height} ซม.` : "-"}</span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-44">กรุ๊ปเลือด:</span>
                <span>{patient.blood_type || "-"}</span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-44">
                  เคยเป็นเบาหวานขณะตั้งครรภ์:
                </span>
                <span>{patient.previous_gdm ? "เคย" : "ไม่เคย"}</span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-44">
                  ประวัติเบาหวานในครอบครัว:
                </span>
                <span>{patient.family_diabetes_history ? "มี" : "ไม่มี"}</span>
              </div>
            </div>
          </div>

          {/* ข้อมูลล่าสุด */}
          <div className="md:w-1/3">
            <h3 className="font-semibold text-lg mb-3">ข้อมูลล่าสุด</h3>
            <div className="space-y-3">
              {/* น้ำหนักล่าสุด */}
              {patient.latest_weight && (
                <div className="flex items-start">
                  <FaWeight className="text-purple-600 mt-1 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">น้ำหนักล่าสุด</p>
                    <p className="font-medium">
                      {patient.latest_weight.weight} กก.
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(
                        new Date(patient.latest_weight.record_date),
                        "d MMM yyyy",
                        { locale: th }
                      )}
                    </p>
                    {patient.height && (
                      <p className="text-sm">
                        BMI:{" "}
                        {calculateBMI(
                          patient.latest_weight.weight,
                          patient.height
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* การนัดหมายที่จะมาถึง */}
              {patient.upcoming_appointments &&
                patient.upcoming_appointments.length > 0 && (
                  <div className="flex items-start">
                    <FaCalendarAlt className="text-purple-600 mt-1 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">
                        การนัดหมายที่จะมาถึง
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(
                            patient.upcoming_appointments[0].appointment_date
                          ),
                          "d MMM yyyy",
                          { locale: th }
                        )}{" "}
                        {format(
                          new Date(
                            `2000-01-01T${patient.upcoming_appointments[0].appointment_time}`
                          ),
                          "HH:mm น."
                        )}
                      </p>
                      <p className="text-sm">
                        {patient.upcoming_appointments[0].appointment_type}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto">
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "overview"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            ภาพรวม
          </button>
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "glucose"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("glucose")}
          >
            ค่าน้ำตาล
          </button>
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "weight"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("weight")}
          >
            น้ำหนัก
          </button>
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "appointments"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("appointments")}
          >
            การนัดหมาย
          </button>
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "treatments"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("treatments")}
          >
            การรักษา
          </button>
          <button
            className={`py-3 px-4 text-center ${
              activeTab === "medications"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("medications")}
          >
            ยา
          </button>
        </div>
      </div>

      {/* แสดงข้อมูลตาม Tab ที่เลือก */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* กราฟแนวโน้มค่าน้ำตาล */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                แนวโน้มค่าน้ำตาลในเลือด
              </h2>
              <button
                onClick={() => setActiveTab("glucose")}
                className="text-purple-600 hover:text-purple-800 text-sm"
              >
                ดูเพิ่มเติม
              </button>
            </div>

            {glucoseReadings.length > 0 ? (
              <div className="h-64">
                <Line
                  data={prepareGlucoseChartData()}
                  options={glucoseChartOptions}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
                <p className="text-gray-500">ไม่มีข้อมูลค่าน้ำตาลในเลือด</p>
              </div>
            )}
          </div>

          {/* กราฟแนวโน้มน้ำหนัก */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">แนวโน้มน้ำหนัก</h2>
              <button
                onClick={() => setActiveTab("weight")}
                className="text-purple-600 hover:text-purple-800 text-sm"
              >
                ดูเพิ่มเติม
              </button>
            </div>

            {weightRecords.length > 0 ? (
              <div className="h-64">
                <Line
                  data={prepareWeightChartData()}
                  options={weightChartOptions}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
                <p className="text-gray-500">ไม่มีข้อมูลน้ำหนัก</p>
              </div>
            )}
          </div>

          {/* เป้าหมายค่าน้ำตาล */}
          {patient.glucose_targets && patient.glucose_targets.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                เป้าหมายค่าน้ำตาลในเลือด
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ประเภท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ค่าต่ำสุด (mg/dL)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ค่าสูงสุด (mg/dL)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่เริ่มใช้
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patient.glucose_targets.map((target) => (
                      <tr key={target.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {target.target_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {target.min_value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {target.max_value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(target.effective_date),
                            "d MMM yyyy",
                            { locale: th }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* การนัดหมายที่กำลังจะมาถึง */}
          {patient.upcoming_appointments &&
            patient.upcoming_appointments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    การนัดหมายที่กำลังจะมาถึง
                  </h2>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    ดูเพิ่มเติม
                  </button>
                </div>

                <div className="space-y-3">
                  {patient.upcoming_appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {appointment.appointment_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(
                              new Date(appointment.appointment_date),
                              "EEEE d MMMM yyyy",
                              { locale: th }
                            )}{" "}
                            เวลา{" "}
                            {format(
                              new Date(
                                `2000-01-01T${appointment.appointment_time}`
                              ),
                              "HH:mm น."
                            )}
                          </div>
                        </div>
                        <div className="text-purple-600">
                          <FaCalendarAlt size={18} />
                        </div>
                      </div>
                      {appointment.location && (
                        <div className="text-sm mt-1">
                          สถานที่: {appointment.location}
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          หมายเหตุ: {appointment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* แสดงข้อมูลค่าน้ำตาล */}
      {activeTab === "glucose" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">ประวัติค่าน้ำตาลในเลือด</h2>
            <Link
              to={`/nurse/patients/${id}/glucose`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              จัดการค่าน้ำตาล
            </Link>
          </div>

          {glucoseReadings.length > 0 ? (
            <>
              <div className="h-64 mb-6">
                <Line
                  data={prepareGlucoseChartData()}
                  options={glucoseChartOptions}
                />
              </div>

              <div className="overflow-x-auto"></div>