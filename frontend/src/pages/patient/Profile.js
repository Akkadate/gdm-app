import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import { API_URL } from "../../config"; // แก้ไข: ใช้ API_URL จาก config

// Validation Schema สำหรับการแก้ไขข้อมูลผู้ใช้
const ProfileSchema = Yup.object().shape({
  first_name: Yup.string().required("กรุณาระบุชื่อ"),
  last_name: Yup.string().required("กรุณาระบุนามสกุล"),
  phone: Yup.string()
    .required("กรุณาระบุเบอร์โทรศัพท์")
    .matches(/^[0-9]{10}$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก"),
});

// Validation Schema สำหรับการเปลี่ยนรหัสผ่าน
const PasswordSchema = Yup.object().shape({
  current_password: Yup.string().required("กรุณาระบุรหัสผ่านปัจจุบัน"),
  new_password: Yup.string()
    .required("กรุณาระบุรหัสผ่านใหม่")
    .min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("new_password"), null], "รหัสผ่านไม่ตรงกัน")
    .required("กรุณายืนยันรหัสผ่าน"),
});

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' หรือ 'password'

  useEffect(() => {
    fetchUserData();
  }, []);

  // ดึงข้อมูลผู้ใช้และข้อมูลผู้ป่วย
  const fetchUserData = async () => {
    try {
      setLoading(true);

      // ดึงข้อมูลผู้ใช้ปัจจุบัน - ไม่ใช้ /auth/me เพราะอาจมีปัญหา
      // แทนที่จะดึงข้อมูลผู้ใช้ใหม่ ให้ใช้ currentUser ที่มีอยู่แล้ว
      setUserData(currentUser);

      // ถ้าบทบาทเป็นผู้ป่วย ค้นหา patient_id
      if (currentUser && currentUser.role === "patient") {
        try {
          // ดึงข้อมูล patient_id เพื่อใช้ในการดึงข้อมูลผู้ป่วย
          const patientResult = await axios.get(
            `${API_URL}/patients?user_id=${currentUser.id}`
          );

          if (patientResult.data && patientResult.data.length > 0) {
            const patientId = patientResult.data[0].id;

            // ดึงข้อมูลผู้ป่วย
            const patientResponse = await axios.get(
              `${API_URL}/patients/${patientId}`
            );
            const patientInfo = patientResponse.data;

            setPatientData(patientInfo);

            // ตั้งค่าวันกำหนดคลอด (ถ้ามี)
            if (patientInfo.expected_delivery_date) {
              setExpectedDeliveryDate(
                new Date(patientInfo.expected_delivery_date)
              );
            }
          }
        } catch (error) {
          console.error("Error fetching patient data:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการแก้ไขข้อมูลส่วนตัว - แก้ไขใหม่ทั้งหมด
  const handleProfileUpdate = async (values, { setSubmitting }) => {
    console.log("Profile update started with values:", values);

    try {
      // แก้ไข: ไม่ใช้ /users/:id แต่ใช้ /auth/profile แทน (ถ้ามี)
      // ถ้าไม่มี ให้เขียน API endpoint ใหม่ที่ให้ผู้ใช้อัปเดตโปรไฟล์ของตัวเอง

      // ตรวจสอบว่า currentUser มี id หรือไม่
      if (!currentUser || !currentUser.id) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }

      // ใช้ /auth/update-profile แทน (สมมติว่ามี endpoint นี้)
      // หรือสร้าง endpoint นี้ในไฟล์ auth.routes.js
      await axios.post(`${API_URL}/auth/update-profile`, {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
      });

      console.log("User info updated successfully");

      // อัปเดตข้อมูลผู้ป่วย (ถ้ามี)
      if (patientData && patientData.id) {
        const patientUpdateData = {
          expected_delivery_date: expectedDeliveryDate
            ? format(expectedDeliveryDate, "yyyy-MM-dd")
            : null,
          height: values.height ? parseFloat(values.height) : null,
          pre_pregnancy_weight: values.pre_pregnancy_weight
            ? parseFloat(values.pre_pregnancy_weight)
            : null,
          gestational_age_at_diagnosis: values.gestational_age_at_diagnosis
            ? parseInt(values.gestational_age_at_diagnosis)
            : null,
          blood_type: values.blood_type || null,
          previous_gdm: values.previous_gdm === "true",
          family_diabetes_history: values.family_diabetes_history === "true",
        };

        console.log("Sending patient update data:", patientUpdateData);

        // ใช้ endpoint พิเศษสำหรับผู้ป่วยอัปเดตข้อมูลตัวเอง
        // หรือสร้าง endpoint นี้ใน patients.routes.js
        const response = await axios.post(
          `${API_URL}/patients/update-self`,
          patientUpdateData
        );

        console.log("Patient update response:", response.data);
      }

      toast.success("อัปเดตข้อมูลสำเร็จ");
      fetchUserData(); // ดึงข้อมูลใหม่
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    try {
      await axios.post(`${API_URL}/users/change-password`, {
        current_password: values.current_password,
        new_password: values.new_password,
      });

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      resetForm();
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response && error.response.status === 400) {
        toast.error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      } else {
        toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ออกจากระบบ
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      logout();
      toast.info("ออกจากระบบสำเร็จ");
    }
  };

  // ตัวเลือกอีกรูปแบบหนึ่ง: ไม่อนุญาตให้อัปเดตข้อมูลโปรไฟล์เลย
  const handleProfileUpdateDisabled = (values, { setSubmitting }) => {
    toast.info(
      "การแก้ไขข้อมูลส่วนตัวยังไม่เปิดให้บริการ กรุณาติดต่อเจ้าหน้าที่"
    );
    setSubmitting(false);
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
      <h1 className="text-2xl font-bold mb-6">โปรไฟล์ของฉัน</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 ${
              activeTab === "profile"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            ข้อมูลส่วนตัว
          </button>
          <button
            className={`py-3 px-6 ${
              activeTab === "password"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("password")}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>

      {/* ข้อมูลส่วนตัว - แก้ไข: เพิ่มข้อความแจ้งเตือนว่าแก้ไขไม่ได้ */}
      {activeTab === "profile" && userData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-yellow-700">
              <strong>หมายเหตุ:</strong>{" "}
              การแก้ไขข้อมูลส่วนตัวยังไม่เปิดให้บริการในขณะนี้
              กรุณาติดต่อเจ้าหน้าที่หากต้องการแก้ไขข้อมูล
            </p>
          </div>

          <Formik
            initialValues={{
              first_name: userData.first_name || "",
              last_name: userData.last_name || "",
              phone: userData.phone || "",
              height: patientData?.height || "",
              pre_pregnancy_weight: patientData?.pre_pregnancy_weight || "",
              gestational_age_at_diagnosis:
                patientData?.gestational_age_at_diagnosis || "",
              blood_type: patientData?.blood_type || "",
              previous_gdm: patientData?.previous_gdm ? "true" : "false",
              family_diabetes_history: patientData?.family_diabetes_history
                ? "true"
                : "false",
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleProfileUpdateDisabled} // แก้ไข: ใช้ฟังก์ชันที่แจ้งเตือนว่าแก้ไขไม่ได้
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ข้อมูลทั่วไป */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">ข้อมูลทั่วไป</h2>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="hospital_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          เลขประจำตัวผู้ป่วย
                        </label>
                        <div className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                          {userData.hospital_id}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="first_name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ชื่อ
                        </label>
                        <Field
                          name="first_name"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                          readOnly
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="last_name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          นามสกุล
                        </label>
                        <Field
                          name="last_name"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                          readOnly
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          เบอร์โทรศัพท์
                        </label>
                        <Field
                          name="phone"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลการตั้งครรภ์ (สำหรับผู้ป่วยเท่านั้น) */}
                  {patientData && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        ข้อมูลการตั้งครรภ์
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="expected_delivery_date"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            วันกำหนดคลอด
                          </label>
                          <div className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                            {expectedDeliveryDate
                              ? format(expectedDeliveryDate, "dd/MM/yyyy")
                              : "ไม่ระบุ"}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="gestational_age_at_diagnosis"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            อายุครรภ์ตอนวินิจฉัย (สัปดาห์)
                          </label>
                          <Field
                            name="gestational_age_at_diagnosis"
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                            readOnly
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="height"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            ส่วนสูง (ซม.)
                          </label>
                          <Field
                            name="height"
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                            readOnly
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="pre_pregnancy_weight"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            น้ำหนักก่อนตั้งครรภ์ (กก.)
                          </label>
                          <Field
                            name="pre_pregnancy_weight"
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                            readOnly
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="blood_type"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            กรุ๊ปเลือด
                          </label>
                          <Field
                            name="blood_type"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            เคยเป็นเบาหวานขณะตั้งครรภ์มาก่อน
                          </label>
                          <div className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                            {patientData.previous_gdm ? "เคย" : "ไม่เคย"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            มีประวัติเบาหวานในครอบครัว
                          </label>
                          <div className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                            {patientData.family_diabetes_history
                              ? "มี"
                              : "ไม่มี"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* แก้ไข: ซ่อนปุ่มบันทึก หรือแทนที่ด้วยปุ่ม "ติดต่อเจ้าหน้าที่" */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={() =>
                      toast.info(
                        "กรุณาติดต่อเจ้าหน้าที่เพื่อแก้ไขข้อมูลส่วนตัว"
                      )
                    }
                  >
                    ติดต่อเจ้าหน้าที่
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {/* เปลี่ยนรหัสผ่าน */}
      {activeTab === "password" && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">เปลี่ยนรหัสผ่าน</h2>

          <Formik
            initialValues={{
              current_password: "",
              new_password: "",
              confirm_password: "",
            }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordChange}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label
                    htmlFor="current_password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    รหัสผ่านปัจจุบัน
                  </label>
                  <Field
                    name="current_password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <ErrorMessage
                    name="current_password"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    รหัสผ่านใหม่
                  </label>
                  <Field
                    name="new_password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <ErrorMessage
                    name="new_password"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <Field
                    name="confirm_password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <ErrorMessage
                    name="confirm_password"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {/* ปุ่มออกจากระบบ */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default Profile;
