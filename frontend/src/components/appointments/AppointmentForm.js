import React, { useState, useEffect } from "react";
import { X, Save, Calendar, Clock, User, FileText, Check } from "lucide-react";
import { format, parse, isValid, parseISO } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Appointment Form component
 * For creating and editing appointments
 * @param {Object} props - Component props
 * @param {Object} props.appointment - Appointment data (for editing)
 * @param {Array} props.patients - Available patients
 * @param {Array} props.providers - Available healthcare providers
 * @param {Function} props.onSave - Function to handle form submission
 * @param {Function} props.onCancel - Function to handle cancellation
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.initialPatient - Pre-selected patient (for new appointments)
 * @param {Date} props.initialDate - Pre-selected date (for new appointments)
 * @returns {JSX.Element} Appointment form component
 */
const AppointmentForm = ({
  appointment,
  patients,
  providers,
  onSave,
  onCancel,
  loading = false,
  initialPatient = null,
  initialDate = null,
}) => {
  const defaultEndTime = (startTimeStr) => {
    if (!startTimeStr) return "";

    try {
      const startTime = parse(startTimeStr, "HH:mm", new Date());
      const endTime = new Date(startTime.getTime() + 30 * 60000); // Add 30 minutes
      return format(endTime, "HH:mm");
    } catch (e) {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    patient_id: "",
    provider_id: "",
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    appointment_time: "09:00",
    end_time: "09:30",
    duration: 30,
    appointment_type: "follow_up",
    status: "scheduled",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  // Initialize form with appointment data if editing
  useEffect(() => {
    if (appointment) {
      // Format dates and times for input fields
      const formattedAppointment = {
        ...appointment,
        appointment_date: appointment.appointment_date
          ? appointment.appointment_date.substring(0, 10)
          : format(new Date(), "yyyy-MM-dd"),
        appointment_time: appointment.appointment_time
          ? appointment.appointment_time.substring(0, 5)
          : "09:00",
      };

      // Calculate end time based on duration
      const duration = appointment.duration || 30;
      formattedAppointment.duration = duration;
      formattedAppointment.end_time = defaultEndTime(
        formattedAppointment.appointment_time
      );

      setFormData(formattedAppointment);
    } else if (initialPatient || initialDate) {
      // Set initial values for new appointment if provided
      const updatedData = { ...formData };

      if (initialPatient) {
        updatedData.patient_id = initialPatient.id;
      }

      if (initialDate) {
        updatedData.appointment_date = format(initialDate, "yyyy-MM-dd");
      }

      setFormData(updatedData);
    }
  }, [appointment, initialPatient, initialDate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle special case for appointment time
    if (name === "appointment_time") {
      setFormData({
        ...formData,
        [name]: value,
        end_time: defaultEndTime(value),
      });
    } else if (name === "duration") {
      // Update end time when duration changes
      const durationValue = parseInt(value, 10) || 30;

      try {
        const startTime = parse(formData.appointment_time, "HH:mm", new Date());
        const endTime = new Date(startTime.getTime() + durationValue * 60000);

        setFormData({
          ...formData,
          [name]: durationValue,
          end_time: format(endTime, "HH:mm"),
        });
      } catch (e) {
        setFormData({
          ...formData,
          [name]: durationValue,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for the field being changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient_id) {
      newErrors.patient_id = "กรุณาเลือกผู้ป่วย";
    }

    if (!formData.provider_id) {
      newErrors.provider_id = "กรุณาเลือกแพทย์";
    }

    if (!formData.appointment_date) {
      newErrors.appointment_date = "กรุณาเลือกวันที่";
    }

    if (!formData.appointment_time) {
      newErrors.appointment_time = "กรุณาเลือกเวลา";
    }

    if (!formData.appointment_type) {
      newErrors.appointment_type = "กรุณาเลือกประเภทการนัดหมาย";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Convert duration to number
        duration: parseInt(formData.duration, 10) || 30,
      };

      // Delete end_time as it's not stored in the database
      delete submissionData.end_time;

      onSave(submissionData);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;

      return format(date, "d MMMM yyyy", { locale: th });
    } catch (e) {
      return dateString;
    }
  };

  // Get appointment type options
  const appointmentTypes = [
    { value: "initial_assessment", label: "ตรวจประเมินครั้งแรก" },
    { value: "follow_up", label: "ตรวจติดตามอาการ" },
    { value: "glucose_test", label: "ตรวจน้ำตาลในเลือด" },
    { value: "ultrasound", label: "อัลตราซาวด์" },
    { value: "nutrition_counseling", label: "ให้คำปรึกษาด้านโภชนาการ" },
    { value: "insulin_education", label: "สอนการฉีดอินซูลิน" },
    { value: "other", label: "อื่นๆ" },
  ];

  // Get appointment status options
  const appointmentStatuses = [
    { value: "scheduled", label: "นัดหมาย" },
    { value: "completed", label: "เสร็จสิ้น" },
    { value: "cancelled", label: "ยกเลิก" },
    { value: "no-show", label: "ไม่มาตามนัด" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {appointment ? "แก้ไขการนัดหมาย" : "สร้างการนัดหมายใหม่"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ผู้ป่วย <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                errors.patient_id ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading}
            >
              <option value="">-- เลือกผู้ป่วย --</option>
              {patients?.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} (
                  {patient.medical_record_number})
                </option>
              ))}
            </select>
            {errors.patient_id && (
              <p className="mt-1 text-sm text-red-500">{errors.patient_id}</p>
            )}
          </div>

          {/* Provider selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แพทย์ผู้นัด <span className="text-red-500">*</span>
            </label>
            <select
              name="provider_id"
              value={formData.provider_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                errors.provider_id ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading}
            >
              <option value="">-- เลือกแพทย์ --</option>
              {providers?.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.first_name} {provider.last_name}
                </option>
              ))}
            </select>
            {errors.provider_id && (
              <p className="mt-1 text-sm text-red-500">{errors.provider_id}</p>
            )}
          </div>

          {/* Date and time selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                className={`w-full pl-10 p-2 border ${
                  errors.appointment_date ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                disabled={loading}
              />
            </div>
            {errors.appointment_date && (
              <p className="mt-1 text-sm text-red-500">
                {errors.appointment_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลา <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                name="appointment_time"
                value={formData.appointment_time}
                onChange={handleChange}
                className={`w-full pl-10 p-2 border ${
                  errors.appointment_time ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                disabled={loading}
              />
            </div>
            {errors.appointment_time && (
              <p className="mt-1 text-sm text-red-500">
                {errors.appointment_time}
              </p>
            )}
          </div>

          {/* Duration and end time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ระยะเวลา (นาที)
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="15">15 นาที</option>
              <option value="30">30 นาที</option>
              <option value="45">45 นาที</option>
              <option value="60">1 ชั่วโมง</option>
              <option value="90">1.5 ชั่วโมง</option>
              <option value="120">2 ชั่วโมง</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลาสิ้นสุด
            </label>
            <input
              type="time"
              value={formData.end_time}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              คำนวณอัตโนมัติจากเวลาเริ่มต้นและระยะเวลา
            </p>
          </div>

          {/* Appointment type and status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทการนัดหมาย <span className="text-red-500">*</span>
            </label>
            <select
              name="appointment_type"
              value={formData.appointment_type}
              onChange={handleChange}
              className={`w-full p-2 border ${
                errors.appointment_type ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading}
            >
              <option value="">-- เลือกประเภท --</option>
              {appointmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.appointment_type && (
              <p className="mt-1 text-sm text-red-500">
                {errors.appointment_type}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !appointment} // Disable for new appointments
            >
              {appointmentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บันทึกเพิ่มเติม
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการนัดหมาย"
              disabled={loading}
            ></textarea>
          </div>
        </div>

        {/* Preview card */}
        {formData.patient_id &&
          formData.appointment_date &&
          formData.appointment_time && (
            <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">
                ข้อมูลการนัดหมาย
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">ผู้ป่วย</div>
                    <div className="text-sm text-gray-600">
                      {patients?.find((p) => p.id === formData.patient_id)
                        ? `${
                            patients.find((p) => p.id === formData.patient_id)
                              .first_name
                          } ${
                            patients.find((p) => p.id === formData.patient_id)
                              .last_name
                          }`
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">แพทย์</div>
                    <div className="text-sm text-gray-600">
                      {providers?.find((p) => p.id === formData.provider_id)
                        ? `${
                            providers.find((p) => p.id === formData.provider_id)
                              .first_name
                          } ${
                            providers.find((p) => p.id === formData.provider_id)
                              .last_name
                          }`
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">วันที่และเวลา</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(formData.appointment_date)}{" "}
                      {formData.appointment_time} - {formData.end_time} น.
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">ประเภท</div>
                    <div className="text-sm text-gray-600">
                      {appointmentTypes.find(
                        (t) => t.value === formData.appointment_type
                      )?.label || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Form actions */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
            disabled={loading}
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> บันทึกการนัดหมาย
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
