import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { format, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { Bar, Line, Pie } from "react-chartjs-2";
import { API_URL } from "../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("glucose_summary");
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [patientsWithHighGlucose, setPatientsWithHighGlucose] = useState([]);
  const [monthlyPatientCount, setMonthlyPatientCount] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // API endpoint จะแตกต่างกันตามประเภทรายงาน
      let url;

      switch (reportType) {
        case "glucose_summary":
          url = `${API_URL}/reports/glucose?start_date=${format(
            startDate,
            "yyyy-MM-dd"
          )}&end_date=${format(endDate, "yyyy-MM-dd")}`;
          break;
        case "uncontrolled_patients":
          url = `${API_URL}/reports/uncontrolled?start_date=${format(
            startDate,
            "yyyy-MM-dd"
          )}&end_date=${format(endDate, "yyyy-MM-dd")}`;
          break;
        case "monthly_count":
          url = `${API_URL}/reports/monthly`;
          break;
        default:
          url = `${API_URL}/reports/glucose?start_date=${format(
            startDate,
            "yyyy-MM-dd"
          )}&end_date=${format(endDate, "yyyy-MM-dd")}`;
      }

      const response = await axios.get(url);

      setReportData(response.data);

      // จำลองข้อมูลผู้ป่วยที่ควบคุมระดับน้ำตาลไม่ได้
      setPatientsWithHighGlucose([
        {
          id: 1,
          hospital_id: "P00001",
          first_name: "สมหญิง",
          last_name: "จริงใจ",
          avg_glucose: 152.3,
          max_glucose: 219.5,
          readings_count: 24,
        },
        {
          id: 2,
          hospital_id: "P00007",
          first_name: "นารี",
          last_name: "ดีงาม",
          avg_glucose: 148.7,
          max_glucose: 201.2,
          readings_count: 18,
        },
        {
          id: 3,
          hospital_id: "P00012",
          first_name: "กานดา",
          last_name: "มีสุข",
          avg_glucose: 143.1,
          max_glucose: 189.8,
          readings_count: 30,
        },
        {
          id: 4,
          hospital_id: "P00015",
          first_name: "วิไล",
          last_name: "ใจดี",
          avg_glucose: 139.2,
          max_glucose: 183.6,
          readings_count: 21,
        },
        {
          id: 5,
          hospital_id: "P00023",
          first_name: "รัตนา",
          last_name: "วงศ์ไทย",
          avg_glucose: 136.5,
          max_glucose: 178.4,
          readings_count: 15,
        },
      ]);

      // จำลองข้อมูลจำนวนผู้ป่วยรายเดือน
      setMonthlyPatientCount([
        { month: "มกราคม", count: 12 },
        { month: "กุมภาพันธ์", count: 14 },
        { month: "มีนาคม", count: 18 },
        { month: "เมษายน", count: 22 },
        { month: "พฤษภาคม", count: 25 },
        { month: "มิถุนายน", count: 28 },
        { month: "กรกฎาคม", count: 24 },
        { month: "สิงหาคม", count: 30 },
        { month: "กันยายน", count: 32 },
        { month: "ตุลาคม", count: 35 },
        { month: "พฤศจิกายน", count: 38 },
        { month: "ธันวาคม", count: 42 },
      ]);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // สร้างข้อมูลกราฟสรุปค่าน้ำตาลเฉลี่ย
  const glucoseSummaryChartData = {
    labels: [
      "ก่อนอาหารเช้า",
      "หลังอาหารเช้า",
      "ก่อนอาหารกลางวัน",
      "หลังอาหารกลางวัน",
      "ก่อนอาหารเย็น",
      "หลังอาหารเย็น",
      "ก่อนนอน",
    ],
    datasets: [
      {
        label: "ค่าเฉลี่ยน้ำตาลในเลือด (mg/dL)",
        data: [85, 132, 88, 140, 90, 135, 92],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "ค่าสูงสุด (mg/dL)",
        data: [110, 180, 115, 185, 120, 190, 125],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "ค่าต่ำสุด (mg/dL)",
        data: [65, 95, 68, 100, 70, 98, 72],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const glucoseSummaryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "สรุปค่าน้ำตาลเฉลี่ยของผู้ป่วยทั้งหมด",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 200,
      },
    },
  };

  // ข้อมูลกราฟจำนวนผู้ป่วยรายเดือน
  const monthlyCountChartData = {
    labels: monthlyPatientCount.map((item) => item.month),
    datasets: [
      {
        label: "จำนวนผู้ป่วย",
        data: monthlyPatientCount.map((item) => item.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const monthlyCountChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "จำนวนผู้ป่วยรายเดือน",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // ข้อมูลกราฟวงกลมสัดส่วนผู้ป่วยตามระดับน้ำตาลเฉลี่ย
  const glucoseDistributionPieData = {
    labels: ["น้ำตาลปกติ (<90)", "น้ำตาลเสี่ยง (90-125)", "น้ำตาลสูง (>125)"],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 205, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "สัดส่วนผู้ป่วยตามระดับน้ำตาลเฉลี่ย",
      },
    },
  };

  // ฟังก์ชันเปลี่ยนประเภทรายงาน
  const handleReportTypeChange = (type) => {
    setReportType(type);
  };

  // ฟังก์ชันส่งออกรายงาน (จำลอง)
  const handleExportReport = () => {
    alert("ส่งออกรายงานเรียบร้อย (จำลอง)");
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
      <h1 className="text-2xl font-bold mb-6">รายงาน</h1>

      {/* เลือกประเภทรายงานและช่วงเวลา */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทรายงาน
            </label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="glucose_summary">สรุปค่าน้ำตาลเฉลี่ย</option>
              <option value="uncontrolled_patients">
                ผู้ป่วยที่ควบคุมน้ำตาลไม่ได้
              </option>
              <option value="monthly_count">จำนวนผู้ป่วยรายเดือน</option>
            </select>
          </div>

          {reportType !== "monthly_count" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  maxDate={endDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  minDate={startDate}
                  maxDate={new Date()}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            ส่งออกรายงาน
          </button>
        </div>
      </div>

      {/* แสดงรายงานตามประเภทที่เลือก */}
      {reportType === "glucose_summary" && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            สรุปค่าน้ำตาลเฉลี่ยของผู้ป่วยทั้งหมด
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            ช่วงวันที่: {format(startDate, "d MMM yyyy", { locale: th })} -{" "}
            {format(endDate, "d MMM yyyy", { locale: th })}
          </p>

          <div className="h-80 mb-6">
            <Bar
              data={glucoseSummaryChartData}
              options={glucoseSummaryChartOptions}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">
                สัดส่วนผู้ป่วยตามระดับน้ำตาลเฉลี่ย
              </h3>
              <div className="h-64">
                <Pie
                  data={glucoseDistributionPieData}
                  options={pieChartOptions}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">สถิติสรุป</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภทการตรวจ
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ค่าเฉลี่ย
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ค่าต่ำสุด
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ค่าสูงสุด
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      ก่อนอาหารเช้า
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      85 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      65 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      110 mg/dL
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      หลังอาหารเช้า
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      132 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      95 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      180 mg/dL
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      ก่อนอาหารกลางวัน
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      88 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      68 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      115 mg/dL
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      หลังอาหารกลางวัน
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      140 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      100 mg/dL
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      185 mg/dL
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "uncontrolled_patients" && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            ผู้ป่วยที่ควบคุมระดับน้ำตาลไม่ได้
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            ช่วงวันที่: {format(startDate, "d MMM yyyy", { locale: th })} -{" "}
            {format(endDate, "d MMM yyyy", { locale: th })}
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขประจำตัว
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าเฉลี่ย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าสูงสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนครั้ง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patientsWithHighGlucose.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.hospital_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          patient.avg_glucose > 125
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {patient.avg_glucose} mg/dL
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {patient.max_glucose} mg/dL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.readings_count} ครั้ง
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={`/nurse/patients/${patient.id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        ดูข้อมูล
                      </a>
                      <a
                        href={`/nurse/patients/${patient.id}/glucose`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดูค่าน้ำตาล
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === "monthly_count" && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            รายงานจำนวนผู้ป่วยรายเดือน
          </h2>

          <div className="h-80 mb-6">
            <Line
              data={monthlyCountChartData}
              options={monthlyCountChartOptions}
            />
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เดือน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนผู้ป่วย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เปลี่ยนแปลง
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyPatientCount.map((item, index) => {
                  const prevCount =
                    index > 0
                      ? monthlyPatientCount[index - 1].count
                      : item.count;
                  const change = item.count - prevCount;
                  const percentChange = ((change / prevCount) * 100).toFixed(1);

                  return (
                    <tr key={item.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count} คน
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {index > 0 && (
                          <span
                            className={`${
                              change >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {change >= 0 ? "+" : ""}
                            {change} คน ({change >= 0 ? "+" : ""}
                            {percentChange}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
