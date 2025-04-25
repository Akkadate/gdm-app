import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

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
const GlucoseSchema = Yup.object().shape({
  glucose_value: Yup.number()
    .required('กรุณาระบุค่าน้ำตาลในเลือด')
    .min(20, 'ค่าน้ำตาลต้องมากกว่า 20 mg/dL')
    .max(500, 'ค่าน้ำตาลต้องน้อยกว่า 500 mg/dL'),
  reading_type: Yup.string()
    .required('กรุณาเลือกประเภทการตรวจ'),
  notes: Yup.string()
});

const GlucoseLog = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [editingReading, setEditingReading] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'chart'
  const [dateRange, setDateRange] = useState('7days'); // '7days', '30days', 'custom'
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [targets, setTargets] = useState(null);

  // ประเภทการตรวจ
  const readingTypes = [
    { value: 'before_breakfast', label: 'ก่อนอาหารเช้า' },
    { value: 'after_breakfast', label: 'หลังอาหารเช้า' },
    { value: 'before_lunch', label: 'ก่อนอาหารกลางวัน' },
    { value: 'after_lunch', label: 'หลังอาหารกลางวัน' },
    { value: 'before_dinner', label: 'ก่อนอาหารเย็น' },
    { value: 'after_dinner', label: 'หลังอาหารเย็น' },
    { value: 'bedtime', label: 'ก่อนนอน' }
  ];

  useEffect(() => {
    fetchReadings();
    fetchTargets();
  }, [dateRange, customStartDate, customEndDate]);

  // ดึงข้อมูลค่าน้ำตาลตามช่วงเวลาที่เลือก
  const fetchReadings = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/glucose`;
      
      // กำหนดพารามิเตอร์ตามช่วงเวลาที่เลือก
      if (dateRange === '7days') {
        url += '?days=7';
      } else if (dateRange === '30days') {
        url += '?days=30';
      } else if (dateRange === 'custom') {
        url += `?start_date=${format(customStartDate, 'yyyy-MM-dd')}&end_date=${format(customEndDate, 'yyyy-MM-dd')}`;
      }
      
      const response = await axios.get(url);
      setReadings(response.data);
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลเป้าหมายค่าน้ำตาล
  const fetchTargets = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/patients/me`);
      if (response.data && response.data.glucose_targets) {
        setTargets(response.data.glucose_targets);
      }
    } catch (error) {
      console.error('Error fetching glucose targets:', error);
    }
  };

  // บันทึกค่าน้ำตาลใหม่
  const handleSubmit = async (values, { resetForm }) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedTime = format(time, 'HH:mm');
      
      const readingData = {
        ...values,
        reading_date: formattedDate,
        reading_time: formattedTime
      };
      
      let response;
      
      if (editingReading) {
        // ถ้ากำลังแก้ไข ให้ส่งคำขอ PUT
        response = await axios.put(`${process.env.REACT_APP_API_URL}/glucose/${editingReading.id}`, readingData);
        toast.success('แก้ไขข้อมูลสำเร็จ');
        setEditingReading(null);
      } else {
        // ถ้าเพิ่มใหม่ ให้ส่งคำขอ POST
        response = await axios.post(`${process.env.REACT_APP_API_URL}/glucose`, readingData);
        
        // ตรวจสอบว่าค่าน้ำตาลผิดปกติหรือไม่
        if (response.data.isAbnormal) {
          toast.warning('ค่าน้ำตาลของคุณอยู่นอกเกณฑ์ปกติ กรุณาติดต่อพยาบาล');
        } else {
          toast.success('บันทึกข้อมูลสำเร็จ');
        }
      }
      
      // รีเซ็ตฟอร์มและดึงข้อมูลใหม่
      resetForm();
      setDate(new Date());
      setTime(new Date());
      fetchReadings();
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // ลบรายการค่าน้ำตาล
  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/glucose/${id}`);
        toast.success('ลบข้อมูลสำเร็จ');
        fetchReadings();
      } catch (error) {
        console.error('Error deleting glucose reading:', error);
        toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  // ตั้งค่าการแก้ไขรายการ
  const handleEdit = (reading) => {
    setEditingReading(reading);
    setDate(new Date(reading.reading_date));
    setTime(new Date(`2000-01-01T${reading.reading_time}`));
  };

  // ยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingReading(null);
    setDate(new Date());
    setTime(new Date());
  };

  // เปลี่ยนช่วงเวลาที่แสดง
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // จัดกลุ่มข้อมูลตามวันที่
  const groupReadingsByDate = () => {
    const grouped = {};
    
    readings.forEach(reading => {
      const date = reading.reading_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(reading);
    });
    
    // เรียงตามวันที่ล่าสุด
    return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  };

  // แปลงประเภทการตรวจ
  const getReadingTypeLabel = (type) => {
    const readingType = readingTypes.find(rt => rt.value === type);
    return readingType ? readingType.label : type;
  };

  // ตรวจสอบว่าค่าน้ำตาลอยู่ในเกณฑ์ปกติหรือไม่
  const getGlucoseStatusClass = (value, type) => {
    // หากมีการตั้งค่าเป้าหมายเฉพาะ
    if (targets && targets.length > 0) {
      const targetType = type.includes('after') ? 'หลังอาหาร' : 'ก่อนอาหาร';
      const target = targets.find(t => t.target_type === targetType);
      
      if (target) {
        if (value < target.min_value) return 'text-yellow-500';
        if (value > target.max_value) return 'text-red-500';
        return 'text-green-500';
      }
    }
    
    // กรณีไม่มีเป้าหมายเฉพาะ ใช้เกณฑ์ทั่วไป
    if (type.includes('after')) {
      // หลังอาหาร
      if (value < 70) return 'text-yellow-500';
      if (value > 120) return 'text-red-500';
    } else {
      // ก่อนอาหาร หรือก่อนนอน
      if (value < 70) return 'text-yellow-500';
      if (value > 95) return 'text-red-500';
    }
    
    return 'text-green-500';
  };

  // สร้างข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    // จัดกลุ่มข้อมูลตามประเภทการตรวจ
    const dataByType = {};
    const dateLabels = [];
    const dateSet = new Set();
    
    // เรียงข้อมูลตามวันที่
    const sortedReadings = [...readings].sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));
    
    sortedReadings.forEach(reading => {
      if (!dateSet.has(reading.reading_date)) {
        dateSet.add(reading.reading_date);
        dateLabels.push(format(new Date(reading.reading_date), 'd MMM', { locale: th }));
      }
      
      if (!dataByType[reading.reading_type]) {
        dataByType[reading.reading_type] = {};
      }
      
      if (!dataByType[reading.reading_type][reading.reading_date]) {
        dataByType[reading.reading_type][reading.reading_date] = [];
      }
      
      dataByType[reading.reading_type][reading.reading_date].push(Number(reading.glucose_value));
    });
    
    // กำหนดสีสำหรับแต่ละประเภทการตรวจ
    const colors = {
      'before_breakfast': 'rgba(255, 99, 132, 1)',
      'after_breakfast': 'rgba(255, 99, 132, 0.6)',
      'before_lunch': 'rgba(54, 162, 235, 1)',
      'after_lunch': 'rgba(54, 162, 235, 0.6)',
      'before_dinner': 'rgba(75, 192, 192, 1)',
      'after_dinner': 'rgba(75, 192, 192, 0.6)',
      'bedtime': 'rgba(153, 102, 255, 1)'
    };
    
    // สร้างชุดข้อมูลสำหรับแต่ละประเภทการตรวจ
    const datasets = Object.entries(dataByType).map(([type, data]) => {
      const dataPoints = dateLabels.map(label => {
        const date = sortedReadings.find(r => format(new Date(r.reading_date), 'd MMM', { locale: th }) === label)?.reading_date;
        
        if (date && data[date]) {
          // คำนวณค่าเฉลี่ยหากมีหลายค่าต่อวัน
          const sum = data[date].reduce((a, b) => a + b, 0);
          return sum / data[date].length;
        }
        
        return null;
      });
      
      return {
        label: getReadingTypeLabel(type),
        data: dataPoints,
        fill: false,
        borderColor: colors[type] || 'rgba(0, 0, 0, 1)',
        backgroundColor: colors[type] || 'rgba(0, 0, 0, 1)',
        tension: 0.1
      };
    });
    
    return {
      labels: dateLabels,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'แนวโน้มค่าน้ำตาลในเลือด'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} mg/dL`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'mg/dL'
        },
        min: 40,
        max: 250
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">บันทึกค่าน้ำตาลในเลือด</h1>
      
      {/* แบบฟอร์มบันทึกค่าน้ำตาล */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingReading ? 'แก้ไขค่าน้ำตาลในเลือด' : 'บันทึกค่าน้ำตาลในเลือด'}
        </h2>
        
        <Formik
          initialValues={{
            glucose_value: editingReading ? editingReading.glucose_value : '',
            reading_type: editingReading ? editingReading.reading_type : '',
            notes: editingReading ? editingReading.notes : ''
          }}
          enableReinitialize={true}
          validationSchema={GlucoseSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reading_date" className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                  <DatePicker
                    selected={date}
                    onChange={setDate}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    maxDate={new Date()}
                  />
                </div>
                
                <div>
                  <label htmlFor="reading_time" className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
                  <DatePicker
                    selected={time}
                    onChange={setTime}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="เวลา"
                    dateFormat="HH:mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="glucose_value" className="block text-sm font-medium text-gray-700 mb-1">ค่าน้ำตาลในเลือด (mg/dL)</label>
                  <Field
                    type="number"
                    name="glucose_value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ระบุค่าน้ำตาล"
                  />
                  <ErrorMessage name="glucose_value" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div>
                  <label htmlFor="reading_type" className="block text-sm font-medium text-gray-700 mb-1">ประเภทการตรวจ</label>
                  <Field
                    as="select"
                    name="reading_type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">เลือกประเภทการตรวจ</option>
                    {readingTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="reading_type" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">บันทึกเพิ่มเติม</label>
                <Field
                  as="textarea"
                  name="notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                />
                <ErrorMessage name="notes" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : (editingReading ? 'อัปเดต' : 'บันทึก')}
                </button>
                
                {editingReading && (
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
      
      {/* เลือกมุมมองและช่วงเวลา */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              รายการ
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-md ${viewMode === 'chart' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              กราฟ
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDateRangeChange('7days')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '7days' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              7 วัน
            </button>
            <button
              onClick={() => handleDateRangeChange('30days')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '30days' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              30 วัน
            </button>
            <button
              onClick={() => handleDateRangeChange('custom')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              กำหนดเอง
            </button>
          </div>
        </div>
        
        {/* เลือกช่วงวันที่กำหนดเอง */}
        {dateRange === 'custom' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
              <DatePicker
                selected={customStartDate}
                onChange={setCustomStartDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                maxDate={customEndDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
              <DatePicker
                selected={customEndDate}
                onChange={setCustomEndDate}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                minDate={customStartDate}
                maxDate={new Date()}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* แสดงข้อมูล */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
          <p className="text-lg text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : viewMode === 'list' ? (
        // มุมมองรายการ
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ประวัติค่าน้ำตาลในเลือด</h2>
          
          {readings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
          ) : (
            groupReadingsByDate().map(([date, dateReadings]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-1">
                  {format(new Date(date), 'EEEE d MMMM yyyy', { locale: th })}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าน้ำตาล</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บันทึก</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dateReadings.sort((a, b) => a.reading_time.localeCompare(b.reading_time)).map(reading => (
                        <tr key={reading.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(`2000-01-01T${reading.reading_time}`), 'HH:mm น.')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getReadingTypeLabel(reading.reading_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-bold ${getGlucoseStatusClass(reading.glucose_value, reading.reading_type)}`}>
                              {reading.glucose_value} mg/dL
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {reading.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleEdit(reading)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDelete(reading.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // มุมมองกราฟ
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">กราฟแนวโน้มค่าน้ำตาลในเลือด</h2>
          
          {readings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
          ) : (
            <div className="h-96">
              <Line data={prepareChartData()} options={chartOptions} />
            </div>
          )}
          
          {/* ตารางสรุป */}
          {readings.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">สรุปค่าเฉลี่ยตามประเภทการตรวจ</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภทการตรวจ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าเฉลี่ย</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าต่ำสุด</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าสูงสุด</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนครั้ง</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {readingTypes.map(type => {
                      const typeReadings = readings.filter(r => r.reading_type === type.value);
                      if (typeReadings.length === 0) return null;
                      
                      const values = typeReadings.map(r => Number(r.glucose_value));
                      const avg = values.reduce((a, b) => a + b, 0) / values.length;
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      
                      return (
                        <tr key={type.value}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avg.toFixed(1)} mg/dL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{min} mg/dL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{max} mg/dL</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeReadings.length} ครั้ง</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlucoseLog;