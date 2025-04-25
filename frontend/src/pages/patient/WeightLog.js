import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
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

// Validation Schema
const WeightSchema = Yup.object().shape({
  weight: Yup.number()
    .required("กรุณาระบุน้ำหนัก")
    .min(30, "น้ำหนักต้องมากกว่า 30 กก.")
    .max(200, "น้ำหนักต้องน้อยกว่า 200 กก."),
  gestational_age: Yup.number()
    .nullable()
    .typeError("ต้องเป็นตัวเลขเท่านั้น")
    .min(1, "อายุครรภ์ต้องมากกว่า 1 สัปดาห์")
    .max(42, "อายุครรภ์ต้องน้อยกว่า 42 สัปดาห์"),
});

const WeightLog = () => {
  const [weights, setWeights] = useState([]);
  const [patientInfo, setPatientInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [editingWeight, setEditingWeight] = useState(null);
  const [viewMode, setViewMode] = useState("both"); // 'both', 'list', 'chart'

  useEffect(() => {
    fetchWeights();
    fetchPatientInfo();
  }, []);

  const fetchWeights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/weights`
      );
      setWeights(response.data);
    } catch (error) {
      console.error("Error fetching weights:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientInfo = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/me`
      );
      setPatientInfo(response.data);
    } catch (error) {
      console.error("Error fetching patient info:", error);
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      const weightData = {
        ...values,
        record_date: formattedDate,
      };

      if (editingWeight) {
        // แก้ไขข้อมูลน้ำหนัก
        await axios.put(
          `${process.env.REACT_APP_API_URL}/weights/${editingWeight.id}`,
          weightData
        );
        toast.success("แก้ไขข้อมูลสำเร็จ");
        setEditingWeight(null);
      } else {
        // เพิ่มข้อมูลน้ำหนักใหม่
        await axios.post(
          `${process.env.REACT_APP_API_URL}/weights`,
          weightData
        );
        toast.success("บันทึกข้อมูลสำเร็จ");
      }

      resetForm();
      setDate(new Date());
      fetchWeights();
    } catch (error) {
      console.error("Error saving weight:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/weights/${id}`);
        toast.success("ลบข้อมูลสำเร็จ");
        fetchWeights();
      } catch (error) {
        console.error("Error deleting weight:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const handleEdit = (weight) => {
    setEditingWeight(weight);
    setDate(new Date(weight.record_date));
  };

  const handleCancelEdit = () => {
    setEditingWeight(null);
    setDate(new Date());
  };

  // เตรียมข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    // เรียงข้อมูลตามวันที่
    const sortedWeights = [...weights].sort(
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
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
        // กราฟน้ำหนักที่เพิ่มขึ้น
        {
          label: "น้ำหนักที่เพิ่มขึ้น (กก.)",
          data: sortedWeights.map((weight) => weight.weight_gain),
          fill: false,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          tension: 0.1,
          yAxisID: "y1",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "แนวโน้มน้ำหนัก",
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            return `วันที่: ${context[0].label}`;
          },
          label: function (context) {
            if (context.datasetIndex === 0) {
              return `น้ำหนัก: ${context.raw} กก.`;
            } else {
              return `น้ำหนักที่เพิ่มขึ้น: ${context.raw} กก.`;
            }
          },
          afterLabel: function (context) {
            const index = context.dataIndex;
            const weight = weights.sort(
              (a, b) => new Date(a.record_date) - new Date(b.record_date)
            )[index];
            return weight.bmi ? `BMI: ${weight.bmi}` : "";
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "น้ำหนัก (กก.)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "น้ำหนักที่เพิ่มขึ้น (กก.)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // คำนวณ BMI
  const calculateBMI = (weight) => {
    if (!patientInfo.height) return null;

    const heightInMeters = patientInfo.height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
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

  // สีของ BMI
  const getBMIColor = (bmi) => {
    if (!bmi) return "text-gray-500";

    const bmiFmt = parseFloat(bmi);
    if (bmiFmt < 18.5) return "text-yellow-500";
    if (bmiFmt < 25) return "text-green-500";
    if (bmiFmt < 30) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">บันทึกน้ำหนัก</h1>

      {/* แบบฟอร์มบันทึกน้ำหนัก */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingWeight ? "แก้ไขข้อมูลน้ำหนัก" : "บันทึกน้ำหนัก"}
        </h2>

        <Formik
          initialValues={{
            weight: editingWeight ? editingWeight.weight : "",
            gestational_age: editingWeight ? editingWeight.gestational_age : "",
            notes: editingWeight ? editingWeight.notes : "",
          }}
          enableReinitialize={true}
          validationSchema={WeightSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="record_date"
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
                    htmlFor="weight"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    น้ำหนัก (กก.)
                  </label>
                  <Field
                    type="number"
                    name="weight"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ระบุน้ำหนัก"
                  />
                  <ErrorMessage
                    name="weight"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gestational_age"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    อายุครรภ์ (สัปดาห์)
                  </label>
                  <Field
                    type="number"
                    name="gestational_age"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ระบุอายุครรภ์"
                  />
                  <ErrorMessage
                    name="gestational_age"
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

              {patientInfo.height && values.weight && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">
                    BMI:{" "}
                    <span className={getBMIColor(calculateBMI(values.weight))}>
                      {calculateBMI(values.weight)}
                    </span>{" "}
                    ({getBMICategory(calculateBMI(values.weight))})
                  </p>
                  {patientInfo.pre_pregnancy_weight && (
                    <p className="text-sm mt-1">
                      น้ำหนักที่เพิ่มขึ้น:{" "}
                      {(
                        values.weight - patientInfo.pre_pregnancy_weight
                      ).toFixed(1)}{" "}
                      กก.
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : editingWeight
                    ? "อัปเดต"
                    : "บันทึก"}
                </button>

                {editingWeight && (
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

      {/* มุมมองข้อมูล */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode("both")}
            className={`px-3 py-1 rounded-md ${
              viewMode === "both"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-md ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            รายการ
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 rounded-md ${
              viewMode === "chart"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            กราฟ
          </button>
        </div>
      </div>

      {/* กราฟแนวโน้มน้ำหนัก */}
      {(viewMode === "chart" || viewMode === "both") && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">แนวโน้มน้ำหนัก</h2>

          {weights.length < 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                ต้องมีข้อมูลอย่างน้อย 2 รายการเพื่อแสดงกราฟ
              </p>
            </div>
          ) : (
            <div className="h-80">
              <Line data={prepareChartData()} options={chartOptions} />
            </div>
          )}
        </div>
      )}

      {/* แสดงประวัติการบันทึกน้ำหนัก */}
      {(viewMode === "list" || viewMode === "both") && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            ประวัติการบันทึกน้ำหนัก
          </h2>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : weights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ยังไม่มีข้อมูลการบันทึกน้ำหนัก</p>
              <p className="text-gray-500 mt-2">
                กรุณาเพิ่มข้อมูลโดยใช้แบบฟอร์มด้านบน
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      น้ำหนัก (กก.)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      น้ำหนักที่เพิ่มขึ้น
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BMI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อายุครรภ์ (สัปดาห์)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      บันทึก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weights
                    .sort(
                      (a, b) =>
                        new Date(b.record_date) - new Date(a.record_date)
                    )
                    .map((weight) => (
                      <tr key={weight.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(weight.record_date), "d MMM yyyy", {
                            locale: th,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {weight.weight}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {weight.weight_gain !== null
                            ? `${weight.weight_gain > 0 ? "+" : ""}${
                                weight.weight_gain
                              } กก.`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {weight.bmi ? (
                            <span className={getBMIColor(weight.bmi)}>
                              {weight.bmi} ({getBMICategory(weight.bmi)})
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {weight.gestational_age || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {weight.notes || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(weight)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <FaEdit className="inline" /> แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(weight.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="inline" /> ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightLog;
