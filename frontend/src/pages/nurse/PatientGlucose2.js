import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL, GLUCOSE_RANGE } from "../../config";
import { useAuth } from "../../contexts/AuthContext";

// Components
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientHeader from "../../components/nurse/PatientHeader";

const PatientGlucose = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [glucoseReadings, setGlucoseReadings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    period: "week",
    measurementTime: "all",
  });

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await axios.get(`${API_URL}/patients/${id}`, {
          headers: getAuthHeaders(),
        });
        setPatient(response.data);
      } catch (error) {
        console.error("Error fetching patient:", error);
        toast.error("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
        navigate("/nurse/patients");
      }
    };

    fetchPatient();
  }, [id, getAuthHeaders, navigate]);

  // Fetch glucose readings with filters
  useEffect(() => {
    const fetchGlucoseData = async () => {
      if (!patient) return;

      try {
        // Get period parameters
        let params = {};
        if (filter.period === "week") {
          const today = new Date();
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          params.startDate = sevenDaysAgo.toISOString().split("T")[0];
        } else if (filter.period === "month") {
          const today = new Date();
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          params.startDate = thirtyDaysAgo.toISOString().split("T")[0];
        } else if (filter.period === "threemonths") {
          const today = new Date();
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(today.getDate() - 90);
          params.startDate = ninetyDaysAgo.toISOString().split("T")[0];
        }

        // Add measurement time filter if not "all"
        if (filter.measurementTime !== "all") {
          params.measurementTime = filter.measurementTime;
        }

        // Fetch glucose readings
        const glucoseResponse = await axios.get(
          `${API_URL}/patients/${id}/glucose`,
          {
            headers: getAuthHeaders(),
            params,
          }
        );

        setGlucoseReadings(glucoseResponse.data);

        // Calculate statistics
        calculateStats(glucoseResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching glucose data:", error);
        toast.error("ไม่สามารถดึงข้อมูลค่าน้ำตาลได้");
        setLoading(false);
      }
    };

    fetchGlucoseData();
  }, [id, patient, filter, getAuthHeaders]);

  // Calculate statistics from glucose readings
  const calculateStats = (readings) => {
    if (!readings || readings.length === 0) {
      setStats(null);
      return;
    }

    // Group readings by measurement time
    const groupedByTime = readings.reduce((acc, reading) => {
      const time = reading.measurementTime || "other";
      if (!acc[time]) acc[time] = [];
      acc[time].push(reading);
      return acc;
    }, {});

    // Calculate averages and high/low counts for each group
    const timeStats = {};
    let totalHigh = 0;
    let totalLow = 0;
    let totalNormal = 0;

    Object.entries(groupedByTime).forEach(([time, timeReadings]) => {
      const values = timeReadings.map((r) => r.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;

      // Count readings based on ranges
      const range = GLUCOSE_RANGE[time.toUpperCase()] || GLUCOSE_RANGE.NORMAL;
      const highCount = values.filter((v) => v > range.max).length;
      const lowCount = values.filter((v) => v < range.min).length;
      const normalCount = values.filter(
        (v) => v >= range.min && v <= range.max
      ).length;

      totalHigh += highCount;
      totalLow += lowCount;
      totalNormal += normalCount;

      timeStats[time] = {
        count: values.length,
        average: avg,
        highCount,
        lowCount,
        normalCount,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    // Calculate overall statistics
    const allValues = readings.map((r) => r.value);
    const totalSum = allValues.reduce((a, b) => a + b, 0);
    const totalAvg = totalSum / allValues.length;

    // Estimate HbA1c (rough approximation)
    // Formula: HbA1c = (Average Blood Glucose + 46.7) / 28.7
    const estimatedHbA1c = (totalAvg + 46.7) / 28.7;

    const calculatedStats = {
      timeStats,
      total: {
        count: readings.length,
        average: totalAvg,
        highCount: totalHigh,
        lowCount: totalLow,
        normalCount: totalNormal,
        min: Math.min(...allValues),
        max: Math.max(...allValues),
        estimatedHbA1c,
      },
    };

    setStats(calculatedStats);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <LoadingSpinner text="กำลังโหลดข้อมูลค่าน้ำตาล..." />;
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format glucose value with color based on range
  const formatGlucoseValue = (value, measurementTime) => {
    if (value === null || value === undefined) return "-";

    // Get the appropriate range based on measurement time
    const timeKey = measurementTime?.toUpperCase() || "NORMAL";
    const range = GLUCOSE_RANGE[timeKey] || GLUCOSE_RANGE.NORMAL;

    // Determine color based on value
    let colorClass = "text-green-600";
    if (value < range.min) {
      colorClass = "text-blue-600"; // Low
    } else if (value > range.max) {
      colorClass = "text-red-600"; // High
    }

    return <span className={`font-medium ${colorClass}`}>{value} mg/dL</span>;
  };

  // Convert measurement time to readable text
  const getMeasurementTimeText = (time) => {
    const times = {
      fasting: "ก่อนอาหารเช้า (งดอาหาร)",
      before_meal: "ก่อนอาหาร",
      after_meal: "หลังอาหาร",
      bedtime: "ก่อนนอน",
      other: "เวลาอื่นๆ",
    };

    return times[time] || time;
  };

  // Create period options for filter
  const periodOptions = [
    { value: "week", label: "7 วันล่าสุด" },
    { value: "month", label: "30 วันล่าสุด" },
    { value: "threemonths", label: "3 เดือนล่าสุด" },
    { value: "all", label: "ทั้งหมด" },
  ];

  // Create measurement time options for filter
  const timeOptions = [
    { value: "all", label: "ทุกช่วงเวลา" },
    { value: "fasting", label: "ก่อนอาหารเช้า (งดอาหาร)" },
    { value: "before_meal", label: "ก่อนอาหาร" },
    { value: "after_meal", label: "หลังอาหาร" },
    { value: "bedtime", label: "ก่อนนอน" },
    { value: "other", label: "เวลาอื่นๆ" },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {patient && <PatientHeader patient={patient} />}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold mb-4 md:mb-0">
            บันทึกค่าน้ำตาลในเลือด
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ช่วงเวลา
              </label>
              <select
                name="period"
                value={filter.period}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ช่วงเวลาของวัน
              </label>
              <select
                name="measurementTime"
                value={filter.measurementTime}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        {stats && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">สรุปค่าน้ำตาลในเลือด</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  จำนวนการบันทึกทั้งหมด
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats.total.count}
                </div>
                <div className="text-xs text-gray-500">ครั้ง</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  ค่าเฉลี่ยน้ำตาลในเลือด
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats.total.average.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">mg/dL</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">HbA1c โดยประมาณ</div>
                <div className="text-2xl font-bold mt-1">
                  {stats.total.estimatedHbA1c.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">%</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">ช่วงค่าน้ำตาล</div>
                <div className="text-xl font-bold mt-1">
                  {stats.total.min} - {stats.total.max}
                </div>
                <div className="text-xs text-gray-500">mg/dL</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700">ค่าน้ำตาลปกติ</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {stats.total.normalCount}
                </div>
                <div className="text-xs text-green-600">
                  (
                  {Math.round(
                    (stats.total.normalCount / stats.total.count) * 100
                  )}
                  %)
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-700">
                  ค่าน้ำตาลสูงเกินเกณฑ์
                </div>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  {stats.total.highCount}
                </div>
                <div className="text-xs text-red-600">
                  (
                  {Math.round(
                    (stats.total.highCount / stats.total.count) * 100
                  )}
                  %)
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700">
                  ค่าน้ำตาลต่ำกว่าเกณฑ์
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.total.lowCount}
                </div>
                <div className="text-xs text-blue-600">
                  (
                  {Math.round((stats.total.lowCount / stats.total.count) * 100)}
                  %)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Glucose Readings Table */}
        {glucoseReadings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลค่าน้ำตาลที่ตรงตามเงื่อนไขการค้นหา
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่ / เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าน้ำตาล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ช่วงเวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {glucoseReadings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(reading.recordedAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(reading.recordedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatGlucoseValue(
                        reading.value,
                        reading.measurementTime
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getMeasurementTimeText(reading.measurementTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {reading.notes || "-"}
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
  );
};

export default PatientGlucose;
