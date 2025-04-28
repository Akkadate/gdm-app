import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaSave, FaArrowLeft } from 'react-icons/fa';
import { API_URL } from '../../config';

// สร้าง Schema สำหรับตรวจสอบความถูกต้องของข้อมูล
// สร้าง Schema สำหรับตรวจสอบความถูกต้องของข้อมูล
const UserSchema = Yup.object().shape({
  hospital_id: Yup.string()
    .required('กรุณาระบุเลขประจำตัว'),
  first_name: Yup.string()
    .required('กรุณาระบุชื่อ'),
  last_name: Yup.string()
    .required('กรุณาระบุนามสกุล'),
  phone: Yup.string()
    .required('กรุณาระบุเบอร์โทรศัพท์')
    .matches(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'),
  role_id: Yup.number()
    .required('กรุณาเลือกบทบาท'),
  password: Yup.string()
    .test('password-validation', function(value) {
      // ถ้าเป็นผู้ใช้ใหม่ ต้องมีรหัสผ่าน
      if (this.parent.isNewUser && (!value || value.length === 0)) {
        return this.createError({
          message: 'กรุณาระบุรหัสผ่าน'
        });
      }
      
      // ถ้ามีการกรอกรหัสผ่าน ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
      if (value && value.length > 0 && value.length < 6) {
        return this.createError({
          message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
        });
      }
      
      return true;
    })
});

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [roles, setRoles] = useState([]);
  const [initialValues, setInitialValues] = useState({
    hospital_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_id: '',
    password: '',
    is_active: true,
    isNewUser: !id, // ถ้าไม่มี id คือเป็นการสร้างผู้ใช้ใหม่
  });

  // ดึงพารามิเตอร์ role จาก query params ถ้ามี (สำหรับการเรียกจากหน้าพยาบาล)
  const queryParams = new URLSearchParams(location.search);
  const defaultRole = queryParams.get('role');

  // ดึงข้อมูลบทบาทและข้อมูลผู้ใช้
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitializing(true);
        
        // กำหนดบทบาททั้งหมดแบบคงที่ เนื่องจาก API roles ไม่มีในระบบ
        const rolesData = [
          { id: 1, name: 'admin' },
          { id: 2, name: 'nurse' },
          { id: 3, name: 'patient' }
        ];
        setRoles(rolesData);
        
        // ถ้ามี ID ให้ดึงข้อมูลผู้ใช้
        if (id) {
          const userResponse = await axios.get(`${API_URL}/users/${id}`);
          if (userResponse.data) {
            // ปรับข้อมูลให้ตรงกับ form
            const userData = {
              ...userResponse.data,
              role_id: userResponse.data.role_id || '',
              password: '', // ไม่แสดงรหัสผ่านเดิม
              isNewUser: false,
            };
            setInitialValues(userData);
          } else {
            toast.error('ไม่พบข้อมูลผู้ใช้');
            navigate('/admin/users');
          }
        } else if (defaultRole) {
          // ถ้าไม่มี ID แต่มีการกำหนด role จาก query params
          const roleObj = rolesData.find(r => r.name === defaultRole) || 
                           { id: defaultRole === 'nurse' ? 2 : (defaultRole === 'patient' ? 3 : 1) };
          
          setInitialValues({
            ...initialValues,
            role_id: roleObj.id,
            isNewUser: true,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setInitializing(false);
      }
    };
    
    fetchData();
  }, [id, defaultRole]);

  const UserForm = ({ view = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [roles, setRoles] = useState([]);
    const [initialValues, setInitialValues] = useState({
      hospital_id: '',
      first_name: '',
      last_name: '',
      phone: '',
      role_id: '',
      password: '',
      is_active: true,
      isNewUser: !id, // ถ้าไม่มี id คือเป็นการสร้างผู้ใช้ใหม่
    });


  // บันทึกข้อมูลผู้ใช้
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      
      // เตรียมข้อมูลสำหรับส่งไป API
      const userData = {
        hospital_id: values.hospital_id,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        role_id: values.role_id,
        is_active: values.is_active,
      };
      
      // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
      if (values.password) {
        userData.password = values.password;
      }
      
      let response;
      if (id) {
        // อัปเดตผู้ใช้
        response = await axios.put(`${API_URL}/users/${id}`, userData);
        toast.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      } else {
        // สร้างผู้ใช้ใหม่
        response = await axios.post(`${API_URL}/users`, userData);
        toast.success('เพิ่มผู้ใช้ใหม่สำเร็จ');
      }
      
      // ตรวจสอบว่าเป็นการเพิ่มพยาบาลหรือไม่
      if (values.role_id === 2 || 
          (typeof values.role_id === 'string' && 
           (values.role_id === '2' || roles.find(r => r.id === values.role_id)?.name === 'nurse'))) {
        navigate('/admin/nurses');
      } else {
        navigate('/admin/users');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้'}`);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
     <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {view 
              ? 'ข้อมูลผู้ใช้'
              : (id 
                ? 'แก้ไขข้อมูลผู้ใช้' 
                : (defaultRole === 'nurse' 
                  ? 'เพิ่มพยาบาลใหม่' 
                  : (defaultRole === 'patient' 
                    ? 'เพิ่มผู้ป่วยใหม่' 
                    : 'เพิ่มผู้ใช้ใหม่')))}
          </h1>
          <p className="text-gray-600">
            {view ? 'ดูรายละเอียดข้อมูลผู้ใช้' : (id ? 'แก้ไขข้อมูลผู้ใช้ในระบบ' : 'เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ')}
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center"
        >
          <FaArrowLeft className="mr-2" /> ย้อนกลับ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Formik
          initialValues={initialValues}
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hospital_id" className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัว</label>
                  <Field
                    type="text"
                    id="hospital_id"
                    name="hospital_id"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${view ? 'bg-gray-100' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="เลขประจำตัว"
                    disabled={view}
                  />
                  <ErrorMessage name="hospital_id" component="div" className="text-red-500 mt-1 text-sm" />
                </div>

                <div>
                  <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                  <Field
                    as="select"
                    id="role_id"
                    name="role_id"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${view ? 'bg-gray-100' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    disabled={view || defaultRole === 'nurse'}
                  >
                    <option value="">-- เลือกบทบาท --</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name === 'admin' ? 'ผู้ดูแลระบบ' : 
                         role.name === 'nurse' ? 'พยาบาล' : 
                         role.name === 'patient' ? 'ผู้ป่วย' : role.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="role_id" component="div" className="text-red-500 mt-1 text-sm" />
                </div>

                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                  <Field
                    type="text"
                    id="first_name"
                    name="first_name"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${view ? 'bg-gray-100' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="ชื่อ"
                    disabled={view}
                  />
                  <ErrorMessage name="first_name" component="div" className="text-red-500 mt-1 text-sm" />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                  <Field
                    type="text"
                    id="last_name"
                    name="last_name"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${view ? 'bg-gray-100' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="นามสกุล"
                    disabled={view}
                  />
                  <ErrorMessage name="last_name" component="div" className="text-red-500 mt-1 text-sm" />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                  <Field
                    type="text"
                    id="phone"
                    name="phone"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${view ? 'bg-gray-100' : 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="เบอร์โทรศัพท์"
                    disabled={view}
                  />
                  <ErrorMessage name="phone" component="div" className="text-red-500 mt-1 text-sm" />
                </div>

                {!view && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      {id ? 'รหัสผ่าน (กรอกเฉพาะเมื่อต้องการเปลี่ยน)' : 'รหัสผ่าน'}
                    </label>
                    <Field
                      type="password"
                      id="password"
                      name="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={id ? 'ระบุรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'รหัสผ่าน'}
                    />
                    <ErrorMessage name="password" component="div" className="text-red-500 mt-1 text-sm" />
                  </div>
                )}

                <div className="flex items-center mt-4">
                  <Field
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={view}
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    เปิดใช้งานบัญชีนี้
                  </label>
                </div>
              </div>

              {!view && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:bg-blue-300"
                  >
                    <FaSave className="mr-2" /> {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UserForm;