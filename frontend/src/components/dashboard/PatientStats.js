import React from 'react';
import { Users, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon, title, value, bgColor, link }) => {
  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow p-4 flex items-center ${link ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className={`p-3 ${bgColor} rounded-full mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}><CardContent /></Link>;
  }

  return <CardContent />;
};

const PatientStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<Users size={24} className="text-blue-500" />}
        title="ผู้ป่วยทั้งหมด"
        value={stats.patientCounts.total}
        bgColor="bg-blue-100"
        link="/patients"
      />
      
      <StatCard
        icon={<AlertTriangle size={24} className="text-red-500" />}
        title="ผู้ป่วยความเสี่ยงสูง"
        value={stats.patientCounts.high}
        bgColor="bg-red-100"
        link="/patients?risk=high"
      />
      
      <StatCard
        icon={<Calendar size={24} className="text-purple-500" />}
        title="นัดหมายวันนี้"
        value={stats.appointmentsToday}
        bgColor="bg-purple-100"
        link="/appointments"
      />
      
      <StatCard
        icon={<Clock size={24} className="text-orange-500" />}
        title="รอการติดตาม"
        value={stats.alertsCount}
        bgColor="bg-orange-100"
        link="/alerts"
      />
    </div>
  );
};

export default PatientStats;