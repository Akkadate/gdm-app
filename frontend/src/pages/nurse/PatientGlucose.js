import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { format, subDays } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaArrowLeft,
  FaUser,
  FaTint,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Validation Schema for Glucose Target
const GlucoseTargetSchema = Yup.object().shape({
  target_type: Yup.string().required("กรุณาเลือกประเภทเป้าหมาย"),
  min_value: Yup.number()
    .required("กรุณาระบุค่าต่ำสุด")
    .min(10, "ค่าต่ำสุดต้องไม่น้อยกว่า 10")
    .max(300, "ค่าต่ำสุดต้องไม่เกิน 300"),
  max_value: Yup.number()
    .required("กรุณาระบุค่าสูงสุด")
    .min(10, "ค่าสูงสุดต้องไม่น้อยกว่า 10")
    .max(300, "ค่าสูงสุดต้องไม่เกิน 300")
    .test("is-greater", "ค่าสูงสุดต้องมากกว่าค่าต่ำสุด", function (value) {
      const { min_value } = this.parent;
      return !min_value || !value || value > min_value;
    }),
});

const PatientGlucose = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [glucoseReadings, setGlucoseReadings] = useState([]);
  const [glucoseStats, setGlucoseStats] = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days"); // '7days', '30days', '90days', 'custom'
  const [customStartDate, setCustomStartDate] = useState(
    subDays(new Date(), 30)
  );
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [activeView, setActiveView] = useState("overview"); // 'overview', 'readings', 'targets', 'analysis'

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  useEffect(() => {
    if (patient) {
      fetchGlucoseData();
    }
  }, [patient, dateRange, customStartDate, customEndDate]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลผู้ป่วย
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/${id}`
      );
      setPatient(response.data);

      // ดึงข้อมูลเป้าหมายระดับน้ำตาล
      if (response.data.glucose_targets) {
        setTargets(response.data.glucose_targets);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย");

      if (error.response && error.response.status === 404) {
        navigate("/nurse/patients");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGlucoseData = async () => {
    try {
      setLoading(true);

      // กำหนดพารามิเตอร์ตามช่วงเวลาที่เลือก
      let params = {};
      if (dateRange === "7days") {
        params = { days: 7 };
      } else if (dateRange === "30days") {
        params = { days: 30 };
      } else if (dateRange === "90days") {
        params = { days: 90 };
      } else if (dateRange === "custom") {
        params = {
          start_date: format(customStartDate, "yyyy-MM-dd"),
          end_date: format(customEndDate, "yyyy-MM-dd"),
        };
      }

      // เพิ่ม patient_id
      params.patient_id = id;

      // ดึงข้อมูลค่าน้ำตาล
      const readingsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/glucose`,
        { params }
      );
      setGlucoseReadings(readingsResponse.data);

      // ดึงข้อมูลสถิติค่าน้ำตาล
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/glucose/stats`,
        { params }
      );
      setGlucoseStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching glucose data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลค่าน้ำตาล");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTarget = async (values, { resetForm }) => {
    try {
      // เพิ่มวันที่เริ่มใช้ (วันที่ปัจจุบัน)
      const targetData = {
        ...values,
        effective_date: format(new Date(), "yyyy-MM-dd"),
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/patients/${id}/targets`,
        targetData
      );
      toast.success("เพิ่มเป้าหมายระดับน้ำตาลสำเร็จ");

      resetForm();
      setShowTargetForm(false);
      fetchPatientData(); // รีเฟรชข้อมูล
    } catch (error) {
      console.error("Error adding glucose target:", error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มเป้าหมายระดับน้ำตาล");
    }
  };

  // ประเภทการตรวจน้ำตาล
  const readingTypes = [
    { value: "before_breakfast", label: "ก่อนอาหารเช้า" },
    { value: "after_breakfast", label: "หลังอาหารเช้า" },
    { value: "before_lunch", label: "ก่อนอาหารกลางวัน" },
    { value: "after_lunch", label: "หลังอาหารกลางวัน" },
    { value: "before_dinner", label: "ก่อนอาหารเย็น" },
    { value: "after_dinner", label: "หลังอาหารเย็น" },
    { value: "bedtime", label: "ก่อนนอน" },
  ];

  // ฟังก์ชันแปลงประเภทการตรวจเป็นภาษาไทย
  const translateReadingType = (type) => {
    const readingType = readingTypes.find((rt) => rt.value === type);
    return readingType ? readingType.label : type;
  };

  // จัดกลุ่มข้อมูลตามวันที่
  const groupReadingsByDate = () => {
    const grouped = {};

    glucoseReadings.forEach((reading) => {
      const date = reading.reading_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(reading);
    });

    // เรียงตามวันที่ล่าสุด
    return Object.entries(grouped).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  };

  // ตรวจสอบว่าค่าน้ำตาลอยู่ในเกณฑ์ปกติหรือไม่
  const getGlucoseStatusClass = (value, type) => {
    // หากมีการตั้งค่าเป้าหมายเฉพาะ
    if (targets && targets.length > 0) {
      const targetType = type.includes("after") ? "หลังอาหาร" : "ก่อนอาหาร";
      const target = targets.find((t) => t.target_type === targetType);

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

  // สร้างข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    if (!glucoseStats || !glucoseStats.dailyAverage) return null;

    return {
      labels: glucoseStats.dailyAverage.map((item) =>
        format(new Date(item.reading_date), "d MMM", { locale: th })
      ),
      datasets: [
        {
          label: "ค่าเฉลี่ยน้ำตาลในเลือด (mg/dL)",
          data: glucoseStats.dailyAverage.map((item) => item.average_value),
          fill: false,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
      ],
    };
  };

  // สร้างข้อมูลสำหรับกราฟแท่งตามประเภทการตรวจ
  const prepareTypeChartData = () => {
    if (!glucoseStats || !glucoseStats.averageByType) return null;

    return {
      labels: glucoseStats.averageByType.map((item) =>
        translateReadingType(item.reading_type)
      ),
      datasets: [
        {
          label: "ค่าเฉลี่ย (mg/dL)",
          data: glucoseStats.averageByType.map((item) => item.average_value),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "ค่าสูงสุด (mg/dL)",
          data: glucoseStats.averageByType.map((item) => item.max_value),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "ค่าต่ำสุด (mg/dL)",
          data: glucoseStats.averageByType.map((item) => item.min_value),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "แนวโน้มค่าน้ำตาลในเลือด",
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            return `วันที่: ${context[0].label}`;
          },
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y} mg/dL`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "mg/dL",
        },
        min: 50,
        max: 200,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "ค่าน้ำตาลเฉลี่ยตามประเภทการตรวจ",
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "mg/dL",
        },
        min: 0,
        max: 250,
      },
    },
  };

  // เปลี่ยนช่วงเวลาที่แสดง
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  if (loading && !patient) {
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
      {/* หัวข้อและข้อมูลผู้ป่วย */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="flex items-center mb-4 md:mb-0">
            <Link to={`/nurse/patients/${id}`} className="mr-4 text-purple-600">
              <FaArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FaTint className="text-red-500 mr-2" />{" "}
                ข้อมูลระดับน้ำตาลในเลือด
              </h1>
              <p className="text-gray-600">
                {patient.first_name} {patient.last_name}{" "}
                <span className="text-gray-500">({patient.hospital_id})</span>
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              to={`/nurse/patients/${id}`}
              className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <FaUser className="mr-1" /> ข้อมูลผู้ป่วย
            </Link>
            <Link
              to={`/nurse/patients/${id}/treatments`}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <FaCalendarAlt className="mr-1" /> แผนการรักษา
            </Link>
          </div>
        </div>
      </div>

      {/* แท็บเมนู */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto">
          <button
            className={`py-3 px-6 ${
              activeView === "overview"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("overview")}
          >
            ภาพรวม
          </button>
          <button
            className={`py-3 px-6 ${
              activeView === "readings"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("readings")}
          >
            ประวัติการตรวจ
          </button>
          <button
            className={`py-3 px-6 ${
              activeView === "targets"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("targets")}
          >
            เป้าหมายระดับน้ำตาล
          </button>
          <button
            className={`py-3 px-6 ${
              activeView === "analysis"
                ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("analysis")}
          >
            วิเคราะห์แนวโน้ม
          </button>
        </div>
      </div>

      {/* เลือกช่วงเวลา */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDateRangeChange("7days")}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === "7days"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            7 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange("30days")}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === "30days"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            30 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange("90days")}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === "90days"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            90 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange("custom")}
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === "custom"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            กำหนดเอง
          </button>
        </div>

        {/* เลือกช่วงวันที่กำหนดเอง */}
        {dateRange === "custom" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่มต้น
              </label>
              <DatePicker
                selected={customStartDate}
                onChange={setCustomStartDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                maxDate={customEndDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่สิ้นสุด
              </label>
              <DatePicker
                selected={customEndDate}
                onChange={setCustomEndDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                minDate={customStartDate}
                maxDate={new Date()}
              />
            </div>
          </div>
        )}
      </div>

      {/* แสดงเนื้อหาตามแท็บที่เลือก */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* ข้อมูลสรุป */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              สรุประดับน้ำตาลในเลือด
            </h2>

            {glucoseStats && glucoseStats.totalStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-2">ค่าเฉลี่ยทั้งหมด</p>
                  <p className="text-3xl font-bold">
                    {glucoseStats.totalStats.total_average}{" "}
                    <span className="text-sm text-gray-500">mg/dL</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    จากการตรวจ {glucoseStats.totalStats.total_readings} ครั้ง
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-700 mb-2">
                    ค่าน้ำตาลต่ำ (&lt;70 mg/dL)
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {glucoseStats.totalStats.hypo_count}{" "}
                    <span className="text-sm">ครั้ง</span>
                  </p>
                  <p className="mt-2 text-sm text-yellow-700">
                    คิดเป็น{" "}
                    {(
                      (glucoseStats.totalStats.hypo_count /
                        glucoseStats.totalStats.total_readings) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-700 mb-2">
                    ค่าน้ำตาลสูง (&gt;120 mg/dL)
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {glucoseStats.totalStats.hyper_count}{" "}
                    <span className="text-sm">ครั้ง</span>
                  </p>
                  <p className="mt-2 text-sm text-red-700">
                    คิดเป็น{" "}
                    {(
                      (glucoseStats.totalStats.hyper_count /
                        glucoseStats.totalStats.total_readings) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                ไม่พบข้อมูลค่าน้ำตาลในช่วงเวลาที่เลือก
              </p>
            )}
          </div>

          {/* กราฟแนวโน้มค่าน้ำตาล */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              แนวโน้มค่าน้ำตาลในเลือด
            </h2>
            <div className="h-80">
              {glucoseStats &&
              glucoseStats.dailyAverage &&
              glucoseStats.dailyAverage.length > 0 ? (
                <Line data={prepareChartData()} options={chartOptions} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">
                    ไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* กราฟค่าน้ำตาลตามประเภทการตรวจ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              ค่าน้ำตาลตามประเภทการตรวจ
            </h2>
            <div className="h-80">
              {glucoseStats &&
              glucoseStats.averageByType &&
              glucoseStats.averageByType.length > 0 ? (
                <Bar data={prepareTypeChartData()} options={barChartOptions} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">
                    ไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* แสดงประวัติการตรวจระดับน้ำตาล */}
      {activeView === "readings" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            ประวัติการตรวจระดับน้ำตาล
          </h2>

          {glucoseReadings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              ไม่พบข้อมูลในช่วงเวลาที่เลือก
            </p>
          ) : (
            groupReadingsByDate().map(([date, dateReadings]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-1">
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: th })}
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          เวลา
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ประเภท
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ค่าน้ำตาล
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          บันทึก
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dateReadings
                        .sort((a, b) =>
                          a.reading_time.localeCompare(b.reading_time)
                        )
                        .map((reading) => (
                          <tr key={reading.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(
                                new Date(`2000-01-01T${reading.reading_time}`),
                                "HH:mm น."
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {translateReadingType(reading.reading_type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`font-bold ${getGlucoseStatusClass(
                                  reading.glucose_value,
                                  reading.reading_type
                                )}`}
                              >
                                {reading.glucose_value} mg/dL
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {reading.notes || "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* แสดงเป้าหมายระดับน้ำตาล */}
      {activeView === "targets" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">เป้าหมายระดับน้ำตาล</h2>
            <button
              onClick={() => setShowTargetForm(!showTargetForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {showTargetForm ? "ยกเลิก" : "เพิ่มเป้าหมายใหม่"}
            </button>
          </div>

          {/* แบบฟอร์มเพิ่มเป้าหมายใหม่ */}
          {showTargetForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">
                เพิ่มเป้าหมายระดับน้ำตาล
              </h3>
              <Formik
                initialValues={{
                  target_type: "",
                  min_value: "",
                  max_value: "",
                  notes: "",
                }}
                validationSchema={GlucoseTargetSchema}
                onSubmit={handleAddTarget}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="target_type"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ประเภทเป้าหมาย
                        </label>
                        <Field
                          as="select"
                          name="target_type"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">เลือกประเภทเป้าหมาย</option>
                          <option value="ก่อนอาหาร">ก่อนอาหาร</option>
                          <option value="หลังอาหาร">หลังอาหาร</option>
                        </Field>
                        <ErrorMessage
                          name="target_type"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="min_value"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ค่าต่ำสุด (mg/dL)
                        </label>
                        <Field
                          type="number"
                          name="min_value"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <ErrorMessage
                          name="min_value"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="max_value"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ค่าสูงสุด (mg/dL)
                        </label>
                        <Field
                          type="number"
                          name="max_value"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <ErrorMessage
                          name="max_value"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="notes"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          หมายเหตุ
                        </label>
                        <Field
                          as="textarea"
                          name="notes"
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        {isSubmitting ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* แสดงรายการเป้าหมายที่ตั้งไว้ */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าต่ำสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าสูงสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่เริ่มใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {targets.length > 0 ? (
                  targets.map((target, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {target.target_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {target.min_value} mg/dL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {target.max_value} mg/dL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(target.effective_date), "d MMM yyyy", {
                          locale: th,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {target.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      ยังไม่มีการตั้งค่าเป้าหมายระดับน้ำตาล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* วิเคราะห์แนวโน้ม */}
      {activeView === "analysis" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">
            วิเคราะห์แนวโน้มระดับน้ำตาลในเลือด
          </h2>

          {glucoseStats && glucoseStats.totalStats ? (
            <div className="space-y-6">
              {/* สรุปสถิติทั่วไป */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-3">สรุปสถิติทั่วไป</h3>
                <p className="mb-2">
                  ค่าเฉลี่ยรวม:{" "}
                  <span className="font-bold">
                    {glucoseStats.totalStats.total_average} mg/dL
                  </span>
                  (จาก {glucoseStats.totalStats.total_readings} ครั้ง)
                </p>
                <p className="mb-2">
                  พบค่าน้ำตาลต่ำกว่าเกณฑ์ (&lt;70 mg/dL):{" "}
                  <span className="font-bold text-yellow-600">
                    {glucoseStats.totalStats.hypo_count} ครั้ง
                  </span>
                  (
                  {(
                    (glucoseStats.totalStats.hypo_count /
                      glucoseStats.totalStats.total_readings) *
                    100
                  ).toFixed(1)}
                  %)
                </p>
                <p>
                  พบค่าน้ำตาลสูงกว่าเกณฑ์ (&gt;120 mg/dL):{" "}
                  <span className="font-bold text-red-600">
                    {glucoseStats.totalStats.hyper_count} ครั้ง
                  </span>
                  (
                  {(
                    (glucoseStats.totalStats.hyper_count /
                      glucoseStats.totalStats.total_readings) *
                    100
                  ).toFixed(1)}
                  %)
                </p>
              </div>

              {/* วิเคราะห์ตามช่วงเวลา */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-3">
                  วิเคราะห์ตามช่วงเวลา
                </h3>
                <div className="space-y-2">
                  {glucoseStats.averageByType &&
                    glucoseStats.averageByType.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">
                          {translateReadingType(item.reading_type)}
                        </p>
                        <p className="mt-1">
                          ค่าเฉลี่ย:{" "}
                          <span className="font-bold">
                            {item.average_value} mg/dL
                          </span>
                          (ต่ำสุด: {item.min_value} mg/dL, สูงสุด:{" "}
                          {item.max_value} mg/dL)
                        </p>
                        <p className="text-sm text-gray-500">
                          จำนวนการตรวจ: {item.count} ครั้ง
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* การแปลผลและคำแนะนำ */}
              <div>
                <h3 className="text-lg font-medium mb-3">การแปลผลและคำแนะนำ</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-medium text-purple-800 mb-2">
                    สรุปผลการประเมิน
                  </p>
                  {glucoseStats.totalStats.hyper_count >
                  glucoseStats.totalStats.total_readings * 0.3 ? (
                    <div className="space-y-2">
                      <p className="text-red-600">
                        ผู้ป่วยมีแนวโน้มระดับน้ำตาลในเลือดสูง
                        โดยพบค่าน้ำตาลสูงกว่าเกณฑ์ถึง
                        {(
                          (glucoseStats.totalStats.hyper_count /
                            glucoseStats.totalStats.total_readings) *
                          100
                        ).toFixed(0)}
                        % ของการตรวจทั้งหมด
                      </p>
                      <p className="font-medium mt-2">คำแนะนำ:</p>
                      <ul className="list-disc pl-5 text-gray-800">
                        <li>
                          ควรทบทวนแผนการควบคุมอาหารและการบริโภคคาร์โบไฮเดรต
                        </li>
                        <li>
                          แนะนำให้เพิ่มการเคลื่อนไหวร่างกายหรือกิจกรรมทางกายที่เหมาะสม
                        </li>
                        <li>
                          ติดตามการบันทึกอาหารเพื่อหาความสัมพันธ์กับค่าน้ำตาลที่สูง
                        </li>
                        <li>พิจารณาปรับแผนการรักษาหรือการใช้ยาหากจำเป็น</li>
                      </ul>
                    </div>
                  ) : glucoseStats.totalStats.hypo_count >
                    glucoseStats.totalStats.total_readings * 0.1 ? (
                    <div className="space-y-2">
                      <p className="text-yellow-600">
                        ผู้ป่วยมีภาวะน้ำตาลในเลือดต่ำบ่อยครั้ง
                        โดยพบค่าน้ำตาลต่ำกว่าเกณฑ์ถึง
                        {(
                          (glucoseStats.totalStats.hypo_count /
                            glucoseStats.totalStats.total_readings) *
                          100
                        ).toFixed(0)}
                        % ของการตรวจทั้งหมด
                      </p>
                      <p className="font-medium mt-2">คำแนะนำ:</p>
                      <ul className="list-disc pl-5 text-gray-800">
                        <li>
                          ควรทบทวนการรับประทานอาหารให้สม่ำเสมอ
                          และไม่ควรงดมื้ออาหาร
                        </li>
                        <li>ตรวจสอบการทานอาหารว่างระหว่างมื้อเพิ่มเติม</li>
                        <li>
                          ให้ความรู้เรื่องการจัดการภาวะน้ำตาลต่ำ
                          และการเตรียมพร้อมสำหรับภาวะฉุกเฉิน
                        </li>
                        <li>พิจารณาปรับลดยาหรือปรับแผนการรักษาหากจำเป็น</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="text-green-600">
                        ผู้ป่วยสามารถควบคุมระดับน้ำตาลได้ค่อนข้างดี
                        โดยมีค่าน้ำตาลอยู่ในเกณฑ์ปกติประมาณ
                        {(
                          100 -
                          ((glucoseStats.totalStats.hyper_count +
                            glucoseStats.totalStats.hypo_count) /
                            glucoseStats.totalStats.total_readings) *
                            100
                        ).toFixed(0)}
                        % ของการตรวจทั้งหมด
                      </p>
                      <p className="font-medium mt-2">คำแนะนำ:</p>
                      <ul className="list-disc pl-5 text-gray-800">
                        <li>
                          ให้ผู้ป่วยรักษาแบบแผนการควบคุมอาหารและการออกกำลังกายอย่างต่อเนื่อง
                        </li>
                        <li>
                          ให้กำลังใจและตอกย้ำถึงความสำคัญของการควบคุมระดับน้ำตาลตลอดการตั้งครรภ์
                        </li>
                        <li>ติดตามการตรวจอย่างสม่ำเสมอต่อไป</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              ไม่พบข้อมูลเพียงพอสำหรับการวิเคราะห์
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientGlucose;
