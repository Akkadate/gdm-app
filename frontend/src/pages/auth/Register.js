import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Validation Schema
const RegisterSchema = Yup.object().shape({
  hospital_id: Yup.string()
    .required('กรุณาระบุเลขประจำตัวผู้ป่วย'),
  first_name: Yup.string()
    .required('กรุณาระบุชื่อ'),
  last_name: Yup.string()
    .required('กรุณาระบุนามสกุล'),
  phone: Yup.string()
    .required('กรุณาระบุเบอร์โทรศัพท์')
    .matches(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'),
  password: Yup.string()
    .required('กรุณาระบุรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'รหัสผ่านไม่ตรงกัน')
    .required('กรุณายืนยันรหัสผ่าน')
});

const Register = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState(null);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // ตรวจสอบว่ามีการเลือกวันเกิดหรือไม่
    if (!birthDate) {
      toast.error('กรุณาระบุวันเกิด');
      setSubmitting(false);
      return;
    }

    setLoading(true);
    try {
      // แปลงวันเดือนปีเกิดให้อยู่ในรูปแบบ ISO string (YYYY-MM-DD)
      const formattedBirthDate = birthDate.toISOString().split('T')[0];
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const userData = {
        hospital_id: values.hospital_id,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        password: values.password,
        date_of_birth: formattedBirthDate
      };
      
      const result = await register(userData);
      
      if (result.success) {
        toast.success('ลงทะเบียนสำเร็จ');
        resetForm();
        setBirthDate(null);
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลงทะเบียน');
      console.error('Register error:', error);
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
            ลงทะเบียนผู้ใช้ใหม่
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ระบบติดตามผู้ป่วยเบาหวานขณะตั้งครรภ์
          </p>
        </div>
        
        <Formik
          initialValues={{
            hospital_id: '',
            first_name: '',
            last_name: '',
            phone: '',
            password: '',
            confirmPassword: ''
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm -space-y-px">
                <div className="mb-4">
                  <label htmlFor="hospital_id" className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้ป่วย</label>
                  <Field
                    id="hospital_id"
                    name="hospital_id"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="เลขประจำตัวผู้ป่วย"
                  />
                  <ErrorMessage name="hospital_id" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="mb-4">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <Field
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="ชื่อ"
                  />
                  <ErrorMessage name="first_name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="mb-4">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                  <Field
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="นามสกุล"
                  />
                  <ErrorMessage name="last_name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <Field
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="เบอร์โทรศัพท์"
                  />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="mb-4">
                  <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">วันเกิด</label>
                  <DatePicker
                    id="birth_date"
                    selected={birthDate}
                    onChange={date => setBirthDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholderText="เลือกวันเกิด"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    maxDate={new Date()}
                    required
                  />
                  {!birthDate && <div className="text-red-500 text-xs mt-1">กรุณาระบุวันเกิด</div>}
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="รหัสผ่าน"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="ยืนยันรหัสผ่าน"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;