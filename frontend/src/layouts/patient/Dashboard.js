import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
);

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [glucoseData, setGlucoseData] = useState(null);
  const [latestAppointments, setLatestAppointments] = useState([]);
  const [latestWeight, setLatestWeight] = useState(null);
  const [todayReadings, setTodayReadings] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // ดึงข้อมูลผู้ป่วย
        const patientResponse = await axios.get(`${process.env.REACT_APP_API_URL}/patients/me`);
        setPatientInfo(patientResponse.data);
        
        // ดึงข้อมูลค่าน้ำตาล 7 วันย้อนหลัง
        const glucoseResponse = await axios.get(`${process.env.REACT_APP_API_URL}/glucose/stats?days=7`);
        setGlucoseData(glucoseResponse.data);
        
        // ดึงข้อมูลการนัดหมายที่กำลังจะมาถึง
        const appointmentsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/appointments?upcoming=true&limit=3`);
        setLatestAppointments(appointmentsResponse.data);
        
        // ดึงข้อมูลน้ำหนักล่าสุด
        const weightResponse = await axios.get(`${process.env.REACT_APP_API_URL}/weights/latest`);
        setLatestWeight(weightResponse.data);
        
        // ดึงข้อมูลค่าน้ำตาลวันนี้
        const todayReadingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/glucose?date=${format(new Date(), 'yyyy-MM-dd')}`);
        setTodayReadings(todayReadingsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // เตรียมข้อมูลสำหรับแสดงกราฟค่าน้ำตาลย้อนหลัง
  const glucoseChartData = {
    labels: glucoseData?.dailyAverage.map(item => format(new Date(item.reading_date), 'd MMM', { locale: th })) || [],
    datasets: [
      {
        label: 'ค่าเฉลี่ยน้ำตาลในเลือด (mg/dL)',
        data: glucoseData?.dailyAverage.map(item => item.average_value) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };

  const glucoseChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'แนวโน้มค่าน้ำตาลเฉลี่ยในเลือด 7 วันล่าสุด'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        suggestedMin: 60,
        suggestedMax: 200
      }
    }
  };

  // แปลงประเภทการตรวจเป็นภาษาไทย
  const translateReadingType = (type) => {
    const typeMap = {
      'before_breakfast': 'ก่อนอาหารเช้า',
      'after_breakfast': 'หลังอาหารเช้า',
      'before_lunch': 'ก่อนอาหารกลางวัน',
      'after_lunch': 'หลังอาหารกลางวัน',
      'before_dinner': 'ก่อนอาหารเย็น',
      'after_dinner': 'หลังอาหารเย็น',
      'bedtime': 'ก่อนนอน'
    };
    return typeMap[type] || type;
  };

  // คำนวณค่า BMI
  const calculateBMI = () => {
    if (!patientInfo || !latestWeight) return null;
    
    const heightInMeters = patientInfo.height / 100;
    const bmi = latestWeight.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
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
      <h1 className="text-2xl font-bold mb-6">ยินดีต้อนรับ, คุณ{currentUser?.first_name}</h1>
      
      {/* วันที่วันนี้ */}
      <div className="mb-6">
        <p className="text-lg">วันที่: {format(new Date(), 'd MMMM yyyy', { locale: th })}</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* ค่าน้ำตาลวันนี้ */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">ค่าน้ำตาลวันนี้</h2>
          {todayReadings.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 gap-2">
                {todayReadings.map((reading) => (
                  <div key={reading.id} className="border rounded p-2">
                    <p className="text-sm">{translateReadingType(reading.reading_type)}</p>
                    <p className={`text-xl font-bold ${
                      reading.glucose_value > 120 ? 'text-red-500' : 
                      reading.glucose_value < 70 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {reading.glucose_value} mg/dL
                    </p>
                    <p className="text-xs text-gray-500">{format(new Date(`2000-01-01T${reading.reading_time}`), 'HH:mm น.')}</p>
                  </div>
                ))}
              </div>
              <Link to="/patient/glucose" className="block mt-3 text-indigo-600 text-sm hover:underline">
                ดูบันทึกทั้งหมด
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">ยังไม่มีการบันทึกสำหรับวันนี้</p>
              <Link to="/patient/glucose" className="block mt-3 text-indigo-600 text-sm hover:underline">
                บันทึกค่าน้ำตาล
              </Link>
            </div>
          )}
        </div>
        
        {/* น้ำหนักล่าสุด */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">น้ำหนักล่าสุด</h2>
          {latestWeight ? (
            <div>
              <p className="text-2xl font-bold">{latestWeight.weight} กก.</p>
              <p className="text-sm text-gray-500">
                บันทึกเมื่อ {format(new Date(latestWeight.record_date), 'd MMM yyyy', { locale: th })}
              </p>
              {calculateBMI() && (
                <div className="mt-2">
                  <p className="text-sm">BMI: <span className="font-semibold">{calculateBMI()}</span></p>
                </div>
              )}
              <Link to="/patient/weight" className="block mt-3 text-indigo-600 text-sm hover:underline">
                บันทึกน้ำหนักใหม่
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">ยังไม่มีการบันทึกน้ำหนัก</p>
              <Link to="/patient/weight" className="block mt-3 text-indigo-600 text-sm hover:underline">
                บันทึกน้ำหนัก
              </Link>
            </div>
          )}
        </div>
        
        {/* การนัดหมายที่กำลังจะมาถึง */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">การนัดหมายที่กำลังจะมาถึง</h2>
          {latestAppointments.length > 0 ? (
            <div>
              {latestAppointments.map((appointment) => (
                <div key={appointment.id} className="mb-3 pb-3 border-b">
                  <p className="font-medium">{appointment.appointment_type}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(appointment.appointment_date), 'd MMM yyyy', { locale: th })} {' '}
                    {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm น.')}
                  </p>
                </div>
              ))}
              <Link to="/patient/appointments" className="block mt-3 text-indigo-600 text-sm hover:underline">
                ดูการนัดหมายทั้งหมด
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">ไม่มีการนัดหมายที่กำลังจะมาถึง</p>
              <Link to="/patient/appointments" className="block mt-3 text-indigo-600 text-sm hover:underline">
                ดูการนัดหมาย
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Glucose Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">แนวโน้มค่าน้ำตาลในเลือด</h2>
        <div className="h-64">
          {glucoseData?.dailyAverage?.length > 0 ? (
            <Line data={glucoseChartData} options={glucoseChartOptions} />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">ยังไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/patient/glucose" className="bg-indigo-100 rounded-lg p-4 text-center hover:bg-indigo-200">
            <p className="font-medium text-indigo-700">บันทึกค่าน้ำตาล</p>
          </Link>
          <Link to="/patient/meals" className="bg-green-100 rounded-lg p-4 text-center hover:bg-green-200">
            <p className="font-medium text-green-700">บันทึกอาหาร</p>
          </Link>
          <Link to="/patient/weight" className="bg-yellow-100 rounded-lg p-4 text-center hover:bg-yellow-200">
            <p className="font-medium text-yellow-700">บันทึกน้ำหนัก</p>
          </Link>
          <Link to="/patient/activities" className="bg-red-100 rounded-lg p-4 text-center hover:bg-red-200">
            <p className="font-medium text-red-700">บันทึกกิจกรรม</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;