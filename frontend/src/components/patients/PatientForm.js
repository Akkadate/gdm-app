import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

const PatientForm = ({ patient, providers, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    medical_record_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    email: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    estimated_delivery_date: '',
    weeks_pregnant: '',
    gravida: '',
    para: '',
    pre_pregnancy_weight: '',
    current_weight: '',
    height: '',
    family_history_diabetes: false,
    previous_gdm: false,
    previous_macrosomia: false,
    primary_provider_id: ''
  });

  const [errors, setErrors] = useState({});
  
  // Initialize form with patient data if editing
  useEffect(() => {
    if (patient) {
      // Format dates for input fields
      const formattedPatient = { ...patient };
      if (formattedPatient.date_of_birth) {
        formattedPatient.date_of_birth = formattedPatient.date_of_birth.substring(0, 10);
      }
      if (formattedPatient.estimated_delivery_date) {
        formattedPatient.estimated_delivery_date = formattedPatient.estimated_delivery_date.substring(0, 10);
      }
      
      setFormData(formattedPatient);
    }
  }, [patient]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const calculateBMI = () => {
    if (formData.height && formData.pre_pregnancy_weight) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.pre_pregnancy_weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(2);
    }
    return '';
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.medical_record_number) {
      newErrors.medical_record_number = 'กรุณากรอกรหัสผู้ป่วย';
    }
    
    if (!formData.first_name) {
      newErrors.first_name = 'กรุณากรอกชื่อ';
    }
    
    if (!formData.last_name) {
      newErrors.last_name = 'กรุณากรอกนามสกุล';
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'กรุณากรอกวันเกิด';
    }
    
    if (!formData.phone_number) {
      newErrors.phone_number = 'กรุณากรอกเบอร์โทรศัพท์';
    }
    
    // Email format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    // Numeric checks
    if (formData.weeks_pregnant && (formData.weeks_pregnant < 0 || formData.weeks_pregnant > 45)) {
      newErrors.weeks_pregnant = 'อายุครรภ์ต้องอยู่ระหว่าง 0-45 สัปดาห์';
    }
    
    if (formData.pre_pregnancy_weight && (formData.pre_pregnancy_weight < 30 || formData.pre_pregnancy_weight > 200)) {
      newErrors.pre_pregnancy_weight = 'น้ำหนักต้องอยู่ระหว่าง 30-200 กก.';
    }
    
    if (formData.current_weight && (formData.current_weight < 30 || formData.current_weight > 200)) {
      newErrors.current_weight = 'น้ำหนักต้องอยู่ระหว่าง 30-200 กก.';
    }
    
    if (formData.height && (formData.height < 100 || formData.height > 250)) {
      newErrors.height = 'ส่วนสูงต้องอยู่ระหว่าง 100-250 ซม.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Calculate BMI before submitting
      const submissionData = {
        ...formData,
        bmi: calculateBMI() || null
      };
      
      onSave(submissionData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {patient ? 'แก้ไขข้อมูลผู้ป่วย' : 'เพิ่มผู้ป่วยใหม่'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผู้ป่วย <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="medical_record_number"
              value={formData.medical_record_number || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.medical_record_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="รหัสผู้ป่วย"
            />
            {errors.medical_record_number && (
              <p className="mt-1 text-sm text-red-500">{errors.medical_record_number}</p>
            )}
          </div>

          <div className="md:col-span-1">
            {/* Placeholder for equal column layout */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="ชื่อ"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="นามสกุล"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันเกิด <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-sm text-red-500">{errors.date_of_birth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.phone_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="เบอร์โทรศัพท์"
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-500">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="อีเมล"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แพทย์ผู้ดูแล
            </label>
            <select
              name="primary_provider_id"
              value={formData.primary_provider_id || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกแพทย์ --</option>
              {providers && providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.first_name} {provider.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ที่อยู่"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ผู้ติดต่อฉุกเฉิน
            </label>
            <input
              type="text"
              name="emergency_contact"
              value={formData.emergency_contact || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์ฉุกเฉิน
            </label>
            <input
              type="tel"
              name="emergency_phone"
              value={formData.emergency_phone || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เบอร์โทรศัพท์ฉุกเฉิน"
            />
          </div>

          <div className="col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 mt-4">ข้อมูลการตั้งครรภ์</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              กำหนดคลอด
            </label>
            <input
              type="date"
              name="estimated_delivery_date"
              value={formData.estimated_delivery_date || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อายุครรภ์ (สัปดาห์)
            </label>
            <input
              type="number"
              name="weeks_pregnant"
              value={formData.weeks_pregnant || ''}
              onChange={handleChange}
              min="0"
              max="45"
              className={`w-full p-2 border ${errors.weeks_pregnant ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="อายุครรภ์ (สัปดาห์)"
            />
            {errors.weeks_pregnant && (
              <p className="mt-1 text-sm text-red-500">{errors.weeks_pregnant}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนครั้งที่ตั้งครรภ์ (Gravida)
            </label>
            <input
              type="number"
              name="gravida"
              value={formData.gravida || ''}
              onChange={handleChange}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="จำนวนครั้งที่ตั้งครรภ์"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนการคลอด (Para)
            </label>
            <input
              type="number"
              name="para"
              value={formData.para || ''}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="จำนวนการคลอด"
            />
          </div>

          <div className="col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 mt-4">ปัจจัยเสี่ยงเบาหวาน</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              น้ำหนักก่อนตั้งครรภ์ (กก.)
            </label>
            <input
              type="number"
              step="0.1"
              name="pre_pregnancy_weight"
              value={formData.pre_pregnancy_weight || ''}
              onChange={handleChange}
              min="30"
              max="200"
              className={`w-full p-2 border ${errors.pre_pregnancy_weight ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="น้ำหนักก่อนตั้งครรภ์"
            />
            {errors.pre_pregnancy_weight && (
              <p className="mt-1 text-sm text-red-500">{errors.pre_pregnancy_weight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              น้ำหนักปัจจุบัน (กก.)
            </label>
            <input
              type="number"
              step="0.1"
              name="current_weight"
              value={formData.current_weight || ''}
              onChange={handleChange}
              min="30"
              max="200"
              className={`w-full p-2 border ${errors.current_weight ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="น้ำหนักปัจจุบัน"
            />
            {errors.current_weight && (
              <p className="mt-1 text-sm text-red-500">{errors.current_weight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ส่วนสูง (ซม.)
            </label>
            <input
              type="number"
              step="0.1"
              name="height"
              value={formData.height || ''}
              onChange={handleChange}
              min="100"
              max="250"
              className={`w-full p-2 border ${errors.height ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="ส่วนสูง"
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-500">{errors.height}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BMI
            </label>
            <input
              type="text"
              value={calculateBMI()}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              placeholder="BMI (คำนวณอัตโนมัติ)"
            />
          </div>

          <div className="col-span-2">
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="family_history_diabetes"
                  type="checkbox"
                  name="family_history_diabetes"
                  checked={formData.family_history_diabetes || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="family_history_diabetes" className="ml-2 block text-sm text-gray-700">
                  มีประวัติเบาหวานในครอบครัว
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="previous_gdm"
                  type="checkbox"
                  name="previous_gdm"
                  checked={formData.previous_gdm || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="previous_gdm" className="ml-2 block text-sm text-gray-700">
                  เคยเป็นเบาหวานขณะตั้งครรภ์มาก่อน
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="previous_macrosomia"
                  type="checkbox"
                  name="previous_macrosomia"
                  checked={formData.previous_macrosomia || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="previous_macrosomia" className="ml-2 block text-sm text-gray-700">
                  เคยคลอดบุตรน้ำหนักมากกว่า 4 กิโลกรัม
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 mr-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {loading && <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
            <Save size={16} className="mr-1" />
            บันทึก
          </button>
        </div>
      </div>
    </form>
  );
};

export default PatientForm;