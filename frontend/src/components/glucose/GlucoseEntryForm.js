import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { GLUCOSE_READING_TYPES, GLUCOSE_TARGETS } from "../../utils/constants";

/**
 * Glucose Entry Form component for adding or editing glucose readings
 * @param {Object} props - Component props
 * @param {Object} props.glucoseReading - Existing glucose reading data (for edit mode)
 * @param {Object} props.patient - Patient data
 * @param {Function} props.onSave - Function to handle saving glucose reading
 * @param {Function} props.onCancel - Function to handle cancel action
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Glucose entry form
 */
const GlucoseEntryForm = ({
  glucoseReading,
  patient,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    reading_date: "",
    reading_time: "",
    reading_type: "fasting",
    glucose_value: "",
    notes: "",
    is_manually_entered: true,
    device_info: "",
  });

  const [errors, setErrors] = useState({});
  const [outOfRange, setOutOfRange] = useState(false);

  // Initialize form with patient ID and current date/time
  useEffect(() => {
    if (patient) {
      // Get current date and time in format required by form inputs
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

      // Format current time (HH:MM)
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      if (glucoseReading) {
        // Edit mode - use existing reading data
        setFormData({
          patient_id: glucoseReading.patient_id,
          reading_date: glucoseReading.reading_date
            ? glucoseReading.reading_date.slice(0, 10)
            : currentDate,
          reading_time: glucoseReading.reading_time || currentTime,
          reading_type: glucoseReading.reading_type || "fasting",
          glucose_value: glucoseReading.glucose_value || "",
          notes: glucoseReading.notes || "",
          is_manually_entered:
            glucoseReading.is_manually_entered !== undefined
              ? glucoseReading.is_manually_entered
              : true,
          device_info: glucoseReading.device_info || "",
        });

        // Check if reading is out of range
        checkOutOfRange(
          glucoseReading.reading_type,
          glucoseReading.glucose_value
        );
      } else {
        // Add mode - initialize with patient ID and current date/time
        setFormData((prevData) => ({
          ...prevData,
          patient_id: patient.id,
          reading_date: currentDate,
          reading_time: currentTime,
        }));
      }
    }
  }, [patient, glucoseReading]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }

    // Check out of range for glucose value or reading type changes
    if (name === "glucose_value" || name === "reading_type") {
      const readingType =
        name === "reading_type" ? newValue : formData.reading_type;

      const glucoseValue =
        name === "glucose_value"
          ? parseFloat(newValue)
          : parseFloat(formData.glucose_value);

      checkOutOfRange(readingType, glucoseValue);
    }
  };

  // Check if glucose value is out of range
  const checkOutOfRange = (readingType, glucoseValue) => {
    if (!readingType || !glucoseValue) {
      setOutOfRange(false);
      return;
    }

    // Get target range for reading type
    const targetKey = readingType.replace("-", "_");
    const targetRange = GLUCOSE_TARGETS[targetKey] || { min: 70, max: 140 };

    // Check if value is out of range
    const isOut =
      glucoseValue < targetRange.min || glucoseValue > targetRange.max;
    setOutOfRange(isOut);
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.reading_date) {
      newErrors.reading_date = "กรุณาระบุวันที่";
    }

    if (!formData.reading_time) {
      newErrors.reading_time = "กรุณาระบุเวลา";
    }

    if (!formData.reading_type) {
      newErrors.reading_type = "กรุณาเลือกประเภทการวัด";
    }

    if (!formData.glucose_value) {
      newErrors.glucose_value = "กรุณาระบุค่าน้ำตาลในเลือด";
    } else if (isNaN(formData.glucose_value)) {
      newErrors.glucose_value = "ค่าน้ำตาลต้องเป็นตัวเลขเท่านั้น";
    } else {
      const value = parseFloat(formData.glucose_value);
      if (value < 30 || value > 600) {
        newErrors.glucose_value = "ค่าน้ำตาลต้องอยู่ระหว่าง 30-600 mg/dL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert glucose value to number
      const readingData = {
        ...formData,
        glucose_value: parseFloat(formData.glucose_value),
        out_of_range: outOfRange,
      };

      onSave(readingData);
    }
  };

  // Format date display for header
  const getFormattedDate = () => {
    try {
      if (formData.reading_date) {
        return formatDate(formData.reading_date, "d MMMM yyyy");
      }
    } catch (error) {
      // Return raw date if formatting fails
      return formData.reading_date;
    }

    return "";
  };

  // Get reading type display text
  const getReadingTypeText = (type) => {
    switch (type) {
      case "fasting":
        return "ระดับน้ำตาลตอนเช้า";
      case "pre-meal":
        return "ก่อนอาหาร";
      case "post-meal":
        return "หลังอาหาร";
      case "bedtime":
        return "ก่อนนอน";
      default:
        return type;
    }
  };

  // Get target range text for selected reading type
  const getTargetRangeText = () => {
    const readingType = formData.reading_type;
    const targetKey = readingType.replace("-", "_");
    const targetRange = GLUCOSE_TARGETS[targetKey] || { min: 70, max: 140 };

    return `${targetRange.min}-${targetRange.max} mg/dL`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {glucoseReading ? "แก้ไขค่าน้ำตาล" : "เพิ่มค่าน้ำตาล"}
          </h2>
          {patient && (
            <p className="text-sm text-gray-600">
              {patient.first_name} {patient.last_name} - {getFormattedDate()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่วัด <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="reading_date"
              value={formData.reading_date}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border ${
                errors.reading_date ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.reading_date && (
              <p className="mt-1 text-sm text-red-500">{errors.reading_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลาที่วัด <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="reading_time"
              value={formData.reading_time}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border ${
                errors.reading_time ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.reading_time && (
              <p className="mt-1 text-sm text-red-500">{errors.reading_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทการวัด <span className="text-red-500">*</span>
            </label>
            <select
              name="reading_type"
              value={formData.reading_type}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border ${
                errors.reading_type ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="fasting">ระดับน้ำตาลตอนเช้า</option>
              <option value="pre-meal">ก่อนอาหาร</option>
              <option value="post-meal">หลังอาหาร</option>
              <option value="bedtime">ก่อนนอน</option>
            </select>
            {errors.reading_type && (
              <p className="mt-1 text-sm text-red-500">{errors.reading_type}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              เป้าหมาย: {getTargetRangeText()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค่าน้ำตาลในเลือด (mg/dL) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="glucose_value"
              value={formData.glucose_value}
              onChange={handleChange}
              min="30"
              max="600"
              step="1"
              disabled={loading}
              className={`w-full p-2 border ${
                errors.glucose_value
                  ? "border-red-500"
                  : outOfRange
                  ? "border-yellow-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.glucose_value && (
              <p className="mt-1 text-sm text-red-500">
                {errors.glucose_value}
              </p>
            )}
            {outOfRange && !errors.glucose_value && (
              <p className="mt-1 flex items-center text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                ค่าน้ำตาลอยู่นอกช่วงเป้าหมาย
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บันทึกเพิ่มเติม
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="บันทึกเพิ่มเติมเกี่ยวกับค่าน้ำตาล เช่น อาหารที่รับประทาน กิจกรรมที่ทำ หรือเหตุการณ์ที่อาจส่งผลต่อค่าน้ำตาล"
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                id="is_manually_entered"
                name="is_manually_entered"
                type="checkbox"
                checked={formData.is_manually_entered}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_manually_entered"
                className="ml-2 block text-sm text-gray-700"
              >
                ป้อนข้อมูลด้วยตนเอง
                (กรณีที่ไม่ได้ใช้เครื่องวัดที่เชื่อมต่อกับระบบ)
              </label>
            </div>
          </div>

          {!formData.is_manually_entered && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ข้อมูลอุปกรณ์
              </label>
              <input
                type="text"
                name="device_info"
                value={formData.device_info}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="รุ่นและรหัสอุปกรณ์"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 mr-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                บันทึก
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GlucoseEntryForm;
