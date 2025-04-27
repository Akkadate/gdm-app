import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";

// Validation Schema
const LoginSchema = Yup.object().shape({
  hospital_id: Yup.string().required("กรุณาระบุเลขประจำตัวผู้ป่วย"),
  password: Yup.string()
    .required("กรุณาระบุรหัสผ่าน")
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const result = await login(values);

      if (result.success) {
        toast.success("เข้าสู่ระบบสำเร็จ");
        resetForm();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ระบบติดตามผู้ป่วยเบาหวานขณะตั้งครรภ์
          </p>
        </div>

        <Formik
          initialValues={{ hospital_id: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="hospital_id" className="sr-only">
                    เลขประจำตัวผู้ป่วย
                  </label>
                  <Field
                    id="hospital_id"
                    name="hospital_id"
                    type="text"
                    autoComplete="username"
                    required
                    className="..."
                    placeholder="เลขประจำตัวผู้ป่วย"
                  />
                  <ErrorMessage
                    name="hospital_id"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    รหัสผ่าน
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="รหัสผ่าน"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/register"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    ยังไม่มีบัญชี? สมัครสมาชิก
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
