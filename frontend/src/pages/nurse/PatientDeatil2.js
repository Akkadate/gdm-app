import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../contexts/AuthContext";

// Components
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientHeader from "../../components/nurse/PatientHeader";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [recentGlucose, setRecentGlucose] = useState([]);
  const [recentWeight, setRecentWeight] = useState([]);

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Get patient details
        const patientResponse = await axios.get(`${API_URL}/patients/${id}`, {
          headers: getAuthHeaders(),
        });
        setPatient(patientResponse.data);

        // Get patient statistics
        const statsResponse = await axios.get(
          `${API_URL}/patients/${id}/stats`,
          { headers: getAuthHeaders() }
        );
        setPatientStats(statsResponse.data);

        // Get recent glucose readings
        const glucoseResponse = await axios.get(
          `${API_URL}/patients/${id}/glucose?limit=5`,
          { headers: getAuthHeaders() }
        );
        setRecentGlucose(glucoseResponse.data);

        // Get recent weight readings
        const weightResponse = await axios.get(
          `${API_URL}/patients/${id}/weight?limit=5`,
          { headers: getAuthHeaders() }
        );
        setRecentWeight(weightResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching patient data:", error);
        toast.error("ไม่สามารถดึงข้อมูลผู้ป่วยได้");
        navigate("/nurse/patients");
      }
    };

    fetchPatientData();
  }, [id, getAuthHeaders, navigate]);

  if (loading) {
    return <LoadingSpinner text="กำลังโหลดข้อมูลผู้ป่วย..." />;
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

  // Calculate weeks of pregnancy
  const calculatePregnancyWeeks = (startDate) => {
    if (!startDate) return "-";

    const start = new Date(startDate);
    const today = new Date();

    // Calculate difference in milliseconds
    const diffTime = Math.abs(today - start);
    // Convert to days and then to weeks
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return `${weeks} สัปดาห์ ${days} วัน`;
  };

  // Format glucose value with color based on range
  const formatGlucoseValue = (value, measurementTime) => {
    if (value === null || value === undefined) return "-";

    // Define ranges for different measurement times
    const ranges = {
      fasting: { min: 70, max: 95 },
      before_meal: { min: 70, max: 95 },
      after_meal: { min: 70, max: 140 },
      bedtime: { min: 70, max: 120 },
      other: { min: 70, max: 125 },
    };

    const range = ranges[measurementTime] || ranges.other;

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

  return (
    <div className="container mx-auto px-4 py-6">
      {patient && <PatientHeader patient={patient} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">ข้อมูลส่วนตัว</h3>

          <div className="space-y-3">
            <div>
              <span className="text-gray-500">ชื่อ-นามสกุล:</span>
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
            </div>

            <div>
              <span className="text-gray-500">เลขประจำตัวผู้ป่วย:</span>
              <p className="font-medium">{patient.hospitalNumber || "-"}</p>
            </div>

            <div>
              <span className="text-gray-500">วันเดือนปีเกิด:</span>
              <p className="font-medium">{formatDate(patient.birthdate)}</p>
            </div>

            <div>
              <span className="text-gray-500">อีเมล:</span>
              <p className="font-medium">{patient.email}</p>
            </div>

            <div>
              <span className="text-gray-500">เบอร์โทรศัพท์:</span>
              <p className="font-medium">{patient.phone || "-"}</p>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="text-lg font-semibold mb-4">ข้อมูลการตั้งครรภ์</h3>

          <div className="space-y-3">
            <div>
              <span className="text-gray-500">วันที่ฝากครรภ์:</span>
              <p className="font-medium">
                {formatDate(patient.pregnancyStartDate)}
              </p>
            </div>

            <div>
              <span className="text-gray-500">อายุครรภ์:</span>
              <p className="font-medium">
                {calculatePregnancyWeeks(patient.pregnancyStartDate)}
              </p>
            </div>

            <div>
              <span className="text-gray-500">วันกำหนดคลอด:</span>
              <p className="font-medium">{formatDate(patient.dueDate)}</p>
            </div>

            <div>
              <span className="text-gray-500">ระดับความเสี่ยง:</span>
              <p className="font-medium">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    patient.riskLevel === "high"
                      ? "bg-red-100 text-red-800"
                      : patient.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {patient.riskLevel === "high"
                    ? "ความเสี่ยงสูง"
                    : patient.riskLevel === "medium"
                    ? "ความเสี่ยงปานกลาง"
                    : "ความเสี่ยงต่ำ"}
                </span>
              </p>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="text-lg font-semibold mb-4">ข้อมูลแพทย์</h3>

          <div className="space-y-3">
            <div>
              <span className="text-gray-500">แพทย์ผู้ดูแล:</span>
              <p className="font-medium">{patient.doctor || "-"}</p>
            </div>

            <div>
              <span className="text-gray-500">หมายเหตุทางการแพทย์:</span>
              <p className="font-medium">{patient.medicalNotes || "-"}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">สรุปข้อมูลสุขภาพ</h3>

          {patientStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700">
                  ค่าเฉลี่ยน้ำตาลในเลือด
                </div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.averageGlucose?.toFixed(1) || "-"}
                </div>
                <div className="text-xs text-blue-600">mg/dL</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700">
                  ค่า HbA1c โดยประมาณ
                </div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.estimatedHbA1c?.toFixed(1) || "-"}
                </div>
                <div className="text-xs text-green-600">%</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-700">น้ำหนักล่าสุด</div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.latestWeight || "-"}
                </div>
                <div className="text-xs text-purple-600">kg</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-700">BMI</div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.bmi?.toFixed(1) || "-"}
                </div>
                <div className="text-xs text-yellow-600">kg/m²</div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-700">ค่าน้ำตาลเกินเกณฑ์</div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.highGlucoseCount || "0"}
                </div>
                <div className="text-xs text-red-600">ครั้งใน 7 วัน</div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-indigo-700">
                  ค่าน้ำตาลต่ำกว่าเกณฑ์
                </div>
                <div className="text-2xl font-bold mt-1">
                  {patientStats.lowGlucoseCount || "0"}
                </div>
                <div className="text-xs text-indigo-600">ครั้งใน 7 วัน</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              ไม่มีข้อมูลสถิติ
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-medium mb-2">การบันทึกข้อมูล 7 วันล่าสุด</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-lg font-bold text-blue-600">
                  {patientStats?.glucoseCount || "0"}
                </div>
                <div className="text-xs text-gray-600">น้ำตาล</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-lg font-bold text-green-600">
                  {patientStats?.mealCount || "0"}
                </div>
                <div className="text-xs text-gray-600">อาหาร</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-lg font-bold text-purple-600">
                  {patientStats?.activityCount || "0"}
                </div>
                <div className="text-xs text-gray-600">กิจกรรม</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">บันทึกล่าสุด</h3>

          <div className="mb-6">
            <h4 className="font-medium text-blue-700 mb-2">
              ค่าน้ำตาลในเลือดล่าสุด
            </h4>

            {recentGlucose.length === 0 ? (
              <p className="text-gray-500 text-center py-2">
                ไม่มีข้อมูลค่าน้ำตาลล่าสุด
              </p>
            ) : (
              <div className="space-y-3">
                {recentGlucose.map((reading) => (
                  <div key={reading.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">
                          {formatDate(reading.recordedAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(reading.recordedAt).toLocaleTimeString(
                            "th-TH"
                          )}
                        </div>
                        <div className="mt-1">
                          {formatGlucoseValue(
                            reading.value,
                            reading.measurementTime
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {getMeasurementTimeText(reading.measurementTime)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {reading.notes ? `หมายเหตุ: ${reading.notes}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium text-purple-700 mb-2">น้ำหนักล่าสุด</h4>

            {recentWeight.length === 0 ? (
              <p className="text-gray-500 text-center py-2">
                ไม่มีข้อมูลน้ำหนักล่าสุด
              </p>
            ) : (
              <div className="space-y-3">
                {recentWeight.map((reading) => (
                  <div key={reading.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">
                          {formatDate(reading.recordedAt)}
                        </div>
                        <div className="font-medium mt-1">
                          {reading.weight} kg
                        </div>
                      </div>
                      {reading.notes && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            หมายเหตุ: {reading.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
