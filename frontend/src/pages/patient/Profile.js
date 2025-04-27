import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";

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
    console.log(process.env.REACT_APP_API_URL);
    try {
      setLoading(true);
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      console.log(process.env.REACT_APP_API_URL);
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/me`
      );
      setUserData(userResponse.data);

      // ดึงข้อมูลผู้ป่วยเพิ่มเติม
      if (
        userResponse.data.role === "patient" &&
        userResponse.data.patient_data
      ) {
        setPatientData(userResponse.data.patient_data);

        // ตั้งค่าวันกำหนดคลอด (ถ้ามี)
        if (userResponse.data.patient_data.expected_delivery_date) {
          setExpectedDeliveryDate(
            new Date(userResponse.data.patient_data.expected_delivery_date)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการแก้ไขข้อมูลส่วนตัว
  const handleProfileUpdate = async (values, { setSubmitting }) => {
    try {
      // อัปเดตข้อมูลผู้ใช้
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${currentUser.id}`,
        {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
        }
      );

      // อัปเดตข้อมูลผู้ป่วย (ถ้ามี)
      if (patientData) {
        const patientUpdateData = {
          expected_delivery_date: expectedDeliveryDate
            ? format(expectedDeliveryDate, "yyyy-MM-dd")
            : null,
          height: values.height || null,
          pre_pregnancy_weight: values.pre_pregnancy_weight || null,
          gestational_age_at_diagnosis:
            values.gestational_age_at_diagnosis || null,
          blood_type: values.blood_type || null,
          previous_gdm: values.previous_gdm === "true",
          family_diabetes_history: values.family_diabetes_history === "true",
        };

        await axios.put(
          `${process.env.REACT_APP_API_URL}/patients/${patientData.id}`,
          patientUpdateData
        );
      }

      toast.success("อัปเดตข้อมูลสำเร็จ");
      fetchUserData(); // ดึงข้อมูลใหม่
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/users/change-password`,
        {
          current_password: values.current_password,
          new_password: values.new_password,
        }
      );

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

      {/* ข้อมูลส่วนตัว */}
      {activeTab === "profile" && userData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
            onSubmit={handleProfileUpdate}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <ErrorMessage
                          name="first_name"
                          component="div"
                          className="text-red-500 text-xs mt-1"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <ErrorMessage
                          name="last_name"
                          component="div"
                          className="text-red-500 text-xs mt-1"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <ErrorMessage
                          name="phone"
                          component="div"
                          className="text-red-500 text-xs mt-1"
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
                          <DatePicker
                            selected={expectedDeliveryDate}
                            onChange={(date) => setExpectedDeliveryDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholderText="เลือกวันกำหนดคลอด"
                            minDate={new Date()}
                          />
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
                            min="1"
                            max="42"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            step="0.1"
                            min="100"
                            max="200"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            step="0.1"
                            min="30"
                            max="200"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            as="select"
                            name="blood_type"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">-- เลือกกรุ๊ปเลือด --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </Field>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            เคยเป็นเบาหวานขณะตั้งครรภ์มาก่อน
                          </label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                              <Field
                                type="radio"
                                name="previous_gdm"
                                value="true"
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">เคย</span>
                            </label>
                            <label className="inline-flex items-center">
                              <Field
                                type="radio"
                                name="previous_gdm"
                                value="false"
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">ไม่เคย</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            มีประวัติเบาหวานในครอบครัว
                          </label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                              <Field
                                type="radio"
                                name="family_diabetes_history"
                                value="true"
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">มี</span>
                            </label>
                            <label className="inline-flex items-center">
                              <Field
                                type="radio"
                                name="family_diabetes_history"
                                value="false"
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">ไม่มี</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
