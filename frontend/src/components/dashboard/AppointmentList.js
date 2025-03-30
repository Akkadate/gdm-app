import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar, Clock } from 'lucide-react';

const AppointmentList = ({ appointments }) => {
  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', options);
    } catch (e) {
      return dateString;
    }
  };
  
  // Format time to be more readable
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // If the time is in HH:MM:SS format, strip the seconds
    if (timeString.length > 5) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">การนัดหมายที่จะมาถึง</h2>
        <Link 
          to="/appointments" 
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Calendar className="h-4 w-4 mr-1" />
          ดูทั้งหมด
        </Link>
      </div>
      
      <div className="p-4">
        {appointments && appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ป่วย
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ความเสี่ยง
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ดูข้อมูล
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient_first_name} {appointment.patient_last_name}
                      </div>
                      {appointment.medical_record_number && (
                        <div className="text-xs text-gray-500">
                          {appointment.medical_record_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(appointment.appointment_time)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getRiskBadgeColor(appointment.risk_level)
                        }`}
                      >
                        {appointment.risk_level === 'high' ? 'สูง' : 
                         appointment.risk_level === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/patients/${appointment.patient_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีการนัดหมาย</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่พบการนัดหมายที่กำลังจะมาถึง</p>
            <div className="mt-6">
              <Link
                to="/appointments/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                สร้างการนัดหมาย
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;