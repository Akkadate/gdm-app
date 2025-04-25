import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Validation Schema
const ActivitySchema = Yup.object().shape({
  activity_type: Yup.string().required("กรุณาระบุประเภทกิจกรรม"),
  duration: Yup.number()
    .required("กรุณาระบุระยะเวลา")
    .min(1, "ระยะเวลาต้องมากกว่า 0 นาที"),
  intensity: Yup.string().required("กรุณาเลือกความเข้มข้น"),
});

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'chart'
  const [filterDays, setFilterDays] = useState(7);
  const [activityStats, setActivityStats] = useState(null);

  useEffect(() => {
    fetchActivities();
    fetchActivityStats();
  }, [filterDays]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/activities?days=${filterDays}`
      );
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/activities/summary/stats`
      );
      setActivityStats(response.data);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      const activityData = {
        ...values,
        activity_date: formattedDate,
      };

      if (editingActivity) {
        // แก้ไขรายการกิจกรรม
        await axios.put(
          `${process.env.REACT_APP_API_URL}/activities/${editingActivity.id}`,
          activityData
        );
        toast.success("แก้ไขข้อมูลสำเร็จ");
        setEditingActivity(null);
      } else {
        // เพิ่มรายการกิจกรรมใหม่
        await axios.post(
          `${process.env.REACT_APP_API_URL}/activities`,
          activityData
        );
        toast.success("บันทึกข้อมูลสำเร็จ");
      }

      resetForm();
      setDate(new Date());
      fetchActivities();
      fetchActivityStats();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/activities/${id}`);
        toast.success("ลบข้อมูลสำเร็จ");
        fetchActivities();
        fetchActivityStats();
      } catch (error) {
        console.error("Error deleting activity:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setDate(new Date(activity.activity_date));
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setDate(new Date());
  };

  // จัดกลุ่มข้อมูลตามวันที่
  const groupActivitiesByDate = () => {
    const grouped = {};

    activities.forEach((activity) => {
      const date = activity.activity_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });

    // เรียงตามวันที่ล่าสุด
    return Object.entries(grouped).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  };

  // ประเภทกิจกรรมที่แนะนำ
  const suggestedActivityTypes = [
    "เดิน",
    "วิ่งเหยาะ",
    "ว่ายน้ำ",
    "โยคะ",
    "เต้นแอโรบิค",
    "ปั่นจักรยาน",
    "เดินเร็ว",
    "ยืดเหยียด",
    "โยคะสำหรับผู้ตั้งครรภ์",
    "แอโรบิคในน้ำ",
    "อื่นๆ",
  ];

  // ระดับความเข้มข้น
  const intensityLevels = [
    { value: "เบา", label: "เบา" },
    { value: "ปานกลาง", label: "ปานกลาง" },
    { value: "หนัก", label: "หนัก" },
  ];

  // เตรียมข้อมูลสำหรับกราฟแท่งแสดงระยะเวลาการออกกำลังกายรายวัน
  const prepareActivityChartData = () => {
    if (!activityStats || !activityStats.byDate) {
      return null;
    }

    return {
      labels: activityStats.byDate.map((item) =>
        format(new Date(item.activity_date), "d MMM", { locale: th })
      ),
      datasets: [
        {
          label: "ระยะเวลาออกกำลังกาย (นาที)",
          data: activityStats.byDate.map((item) => item.duration),
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
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "ระยะเวลาออกกำลังกายรายวัน",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.parsed.y} นาที`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "นาที",
        },
      },
    },
  };

  // แปลงระดับความเข้มข้นเป็นสี
  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case "เบา":
        return "bg-green-100 text-green-800";
      case "ปานกลาง":
        return "bg-yellow-100 text-yellow-800";
      case "หนัก":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">บันทึกกิจกรรมทางกาย</h1>

      {/* แบบฟอร์มบันทึกกิจกรรม */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingActivity ? "แก้ไขบันทึกกิจกรรม" : "บันทึกกิจกรรมทางกาย"}
        </h2>

        <Formik
          initialValues={{
            activity_type: editingActivity ? editingActivity.activity_type : "",
            duration: editingActivity ? editingActivity.duration : "",
            intensity: editingActivity ? editingActivity.intensity : "",
            notes: editingActivity ? editingActivity.notes : "",
          }}
          enableReinitialize={true}
          validationSchema={ActivitySchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="activity_date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    วันที่
                  </label>
                  <DatePicker
                    selected={date}
                    onChange={setDate}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    maxDate={new Date()}
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity_type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ประเภทกิจกรรม
                  </label>
                  <Field
                    as="select"
                    name="activity_type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">เลือกประเภทกิจกรรม</option>
                    {suggestedActivityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="activity_type"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ระยะเวลา (นาที)
                  </label>
                  <Field
                    type="number"
                    name="duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ระบุระยะเวลา"
                  />
                  <ErrorMessage
                    name="duration"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="intensity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ความเข้มข้น
                  </label>
                  <Field
                    as="select"
                    name="intensity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">เลือกความเข้มข้น</option>
                    {intensityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="intensity"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  บันทึกเพิ่มเติม
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : editingActivity
                    ? "อัปเดต"
                    : "บันทึก"}
                </button>

                {editingActivity && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* ตัวเลือกมุมมองและช่วงเวลา */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                รายการ
              </button>
              <button
                onClick={() => setViewMode("chart")}
                className={`px-4 py-2 rounded-md ${
                  viewMode === "chart"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                กราฟ
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">
              แสดงข้อมูลย้อนหลัง:
            </span>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={7}>7 วัน</option>
              <option value={14}>14 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={90}>3 เดือน</option>
            </select>
          </div>
        </div>
      </div>

      {/* แสดงสรุปกิจกรรม */}
      {viewMode === "chart" && activityStats && activityStats.total && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">สรุปกิจกรรมทางกาย</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-indigo-800 mb-2">
                กิจกรรมทั้งหมด
              </h3>
              <p className="text-3xl font-bold text-indigo-600">
                {activityStats.total.activity_count || 0} ครั้ง
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                เวลาทั้งหมด
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {activityStats.total.total_minutes || 0} นาที
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                เฉลี่ยต่อครั้ง
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {activityStats.total.activity_count
                  ? Math.round(
                      activityStats.total.total_minutes /
                        activityStats.total.activity_count
                    )
                  : 0}{" "}
                นาที
              </p>
            </div>
          </div>

          {/* กราฟแท่งแสดงเวลาออกกำลังกายรายวัน */}
          <div className="h-80 mb-6">
            {activityStats.byDate && activityStats.byDate.length > 0 ? (
              <Bar data={prepareActivityChartData()} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  ไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ
                </p>
              </div>
            )}
          </div>

          {/* สรุปตามประเภทกิจกรรม */}
          {activityStats.byType && activityStats.byType.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">สรุปตามประเภทกิจกรรม</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ประเภทกิจกรรม
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ระยะเวลารวม
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนครั้ง
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityStats.byType.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.activity_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.duration} นาที
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count} ครั้ง
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* สรุปตามความเข้มข้น */}
          {activityStats.byIntensity &&
            activityStats.byIntensity.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">สรุปตามความเข้มข้น</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activityStats.byIntensity.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        item.intensity === "เบา"
                          ? "bg-green-50"
                          : item.intensity === "ปานกลาง"
                          ? "bg-yellow-50"
                          : "bg-red-50"
                      }`}
                    >
                      <h4
                        className={`text-lg font-medium mb-1 ${
                          item.intensity === "เบา"
                            ? "text-green-800"
                            : item.intensity === "ปานกลาง"
                            ? "text-yellow-800"
                            : "text-red-800"
                        }`}
                      >
                        {item.intensity}
                      </h4>
                      <p className="text-2xl font-bold">{item.duration} นาที</p>
                      <p className="text-sm text-gray-500">
                        {item.count} ครั้ง (
                        {Math.round(
                          (item.duration / activityStats.total.total_minutes) *
                            100
                        )}
                        %)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* แสดงประวัติการบันทึกกิจกรรม */}
      {viewMode === "list" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            ประวัติการบันทึกกิจกรรมทางกาย
          </h2>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                ยังไม่มีข้อมูลการบันทึกกิจกรรมทางกาย
              </p>
              <p className="text-gray-500 mt-2">
                กรุณาเพิ่มข้อมูลโดยใช้แบบฟอร์มด้านบน
              </p>
            </div>
          ) : (
            groupActivitiesByDate().map(([date, dateActivities]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-1">
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: th })}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {dateActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="font-semibold">
                              {activity.activity_type}
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getIntensityColor(
                                activity.intensity
                              )}`}
                            >
                              {activity.intensity}
                            </span>
                          </div>

                          <div className="mt-2">
                            <p className="text-gray-700">
                              ระยะเวลา: {activity.duration} นาที
                            </p>
                          </div>

                          {activity.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">
                                {activity.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(activity)}
                            className="text-blue-600 hover:text-blue-800"
                            title="แก้ไข"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="text-red-600 hover:text-red-800"
                            title="ลบ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
