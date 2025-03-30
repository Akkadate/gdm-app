import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Phone, CheckCircle, Calendar } from 'lucide-react';

const AlertList = ({ alerts }) => {
  // Function to format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      
      // Calculate the difference in days
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'วันนี้';
      } else if (diffDays === 1) {
        return 'เมื่อวาน';
      } else if (diffDays < 7) {
        return `${diffDays} วันที่แล้ว`;
      } else {
        // Format as Thai date
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('th-TH', options);
      }
    } catch (e) {
      return dateString;
    }
  };
  
  // Get icon based on alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'glucose':
        return <AlertTriangle size={18} className="text-red-500 mr-2" />;
      case 'appointment':
        return <Calendar size={18} className="text-orange-500 mr-2" />;
      default:
        return <AlertTriangle size={18} className="text-yellow-500 mr-2" />;
    }
  };
  
  // Get alert background color based on risk level
  const getAlertBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-50 border-red-100';
      case 'medium':
        return 'bg-yellow-50 border-yellow-100';
      case 'low':
        return 'bg-green-50 border-green-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold">การแจ้งเตือนที่ต้องได้รับความสนใจ</h2>
      </div>
      
      <div className="p-4">
        {alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={`${alert.type}-${alert.id}`} 
                className={`mb-4 p-3 border rounded-lg ${getAlertBgColor(alert.risk_level)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getAlertIcon(alert.type)}
                    <span className="font-medium">{alert.patient_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(alert.date)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
                <div className="mt-2 flex justify-end">
                  <Link 
                    to={`/patients/${alert.patient_id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 mr-3 flex items-center"
                  >
                    <Phone size={14} className="mr-1" />
                    โทรหาผู้ป่วย
                  </Link>
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => console.log('Mark as handled:', alert.id)}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    จัดการแล้ว
                  </button>
                </div>
              </div>
            ))}
            
            {alerts.length > 5 && (
              <div className="text-center mt-4">
                <Link to="/alerts" className="text-sm text-blue-600 hover:text-blue-800">
                  ดูการแจ้งเตือนทั้งหมด
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="inline-block p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีการแจ้งเตือน</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่พบการแจ้งเตือนที่ต้องได้รับความสนใจ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertList;
      