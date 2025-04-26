import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../contexts/AuthContext";

// Components
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientHeader from "../../components/nurse/PatientHeader";

const TreatmentPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [newTreatment, setNewTreatment] = useState({
    type: "diet",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "active",
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

  // Fetch treatment plans
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/patients/${id}/treatments`,
          { headers: getAuthHeaders() }
        );
        setTreatments(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching treatments:", error);
        toast.error("ไม่สามารถดึงข้อมูลแผนการรักษาได้");
        setLoading(false);
      }
    };

    if (patient) {
      fetchTreatments();
    }
  }, [id, patient, getAuthHeaders]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTreatment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();

    // Validate form
    if (
      !newTreatment.title ||
      !newTreatment.description ||
      !newTreatment.startDate
    ) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post(
        `${API_URL}/patients/${id}/treatments`,
        newTreatment,
        { headers: getAuthHeaders() }
      );

      // Add new treatment to state
      setTreatments((prev) => [...prev, response.data]);

      // Reset form
      setNewTreatment({
        type: "diet",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "active",
      });

      toast.success("เพิ่มแผนการรักษาสำเร็จ");
    } catch (error) {
      console.error("Error adding treatment:", error);
      toast.error("ไม่สามารถเพิ่มแผนการรักษาได้");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (treatmentId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/treatments/${treatmentId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      // Update treatment in state
      setTreatments((prev) =>
        prev.map((treatment) =>
          treatment.id === treatmentId
            ? { ...treatment, status: newStatus }
            : treatment
        )
      );

      toast.success("อัพเดทสถานะแผนการรักษาสำเร็จ");
    } catch (error) {
      console.error("Error updating treatment status:", error);
      toast.error("ไม่สามารถอัพเดทสถานะแผนการรักษาได้");
    }
  };

  const handleDelete = async (treatmentId) => {
    if (!window.confirm("คุณต้องการลบแผนการรักษานี้ใช่หรือไม่?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/treatments/${treatmentId}`, {
        headers: getAuthHeaders(),
      });

      // Remove treatment from state
      setTreatments((prev) =>
        prev.filter((treatment) => treatment.id !== treatmentId)
      );

      toast.success("ลบแผนการรักษาสำเร็จ");
    } catch (error) {
      console.error("Error deleting treatment:", error);
      toast.error("ไม่สามารถลบแผนการรักษาได้");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const treatmentTypeOptions = [
    { value: "diet", label: "แผนโภชนาการ" },
    { value: "exercise", label: "แผนการออกกำลังกาย" },
    { value: "medication", label: "แผนการใช้ยา" },
    { value: "monitoring", label: "แผนการติดตามค่าน้ำตาล" },
    { value: "other", label: "อื่นๆ" },
  ];

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "กำลังใช้งาน";
      case "completed":
        return "เสร็จสิ้น";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type) => {
    const found = treatmentTypeOptions.find((option) => option.value === type);
    return found ? found.label : type;
  };

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

  return (
    <div className="container mx-auto px-4 py-6">
      {patient && <PatientHeader patient={patient} />}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">แผนการรักษา</h2>

        {/* Add new treatment form */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">เพิ่มแผนการรักษาใหม่</h3>

          <form onSubmit={handleAddTreatment}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทแผนการรักษา <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={newTreatment.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  {treatmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแผนการรักษา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTreatment.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={newTreatment.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newTreatment.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={newTreatment.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={newTreatment.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="active">กำลังใช้งาน</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  {saving ? "กำลังบันทึก..." : "เพิ่มแผนการรักษา"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Treatment list */}
        {treatments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ยังไม่มีแผนการรักษาสำหรับผู้ป่วยรายนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left border-b">
                    ชื่อแผนการรักษา
                  </th>
                  <th className="py-3 px-4 text-left border-b">ประเภท</th>
                  <th className="py-3 px-4 text-left border-b">
                    วันที่เริ่มต้น
                  </th>
                  <th className="py-3 px-4 text-left border-b">
                    วันที่สิ้นสุด
                  </th>
                  <th className="py-3 px-4 text-left border-b">สถานะ</th>
                  <th className="py-3 px-4 text-center border-b">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">
                      <div className="font-medium">{treatment.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {treatment.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b">
                      {getTypeLabel(treatment.type)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatDate(treatment.startDate)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatDate(treatment.endDate)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusClass(
                          treatment.status
                        )}`}
                      >
                        {getStatusLabel(treatment.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex justify-center space-x-2">
                        {treatment.status !== "completed" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(treatment.id, "completed")
                            }
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
                            title="ทำเครื่องหมายว่าเสร็จสิ้น"
                          >
                            เสร็จสิ้น
                          </button>
                        )}

                        {treatment.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(treatment.id, "cancelled")
                            }
                            className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                            title="ยกเลิกแผนการรักษา"
                          >
                            ยกเลิก
                          </button>
                        )}

                        {treatment.status !== "active" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(treatment.id, "active")
                            }
                            className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200"
                            title="ทำเครื่องหมายว่ากำลังใช้งาน"
                          >
                            เปิดใช้งาน
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(treatment.id)}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200"
                          title="ลบแผนการรักษา"
                        >
                          ลบ
                        </button>
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

export default TreatmentPlan;
