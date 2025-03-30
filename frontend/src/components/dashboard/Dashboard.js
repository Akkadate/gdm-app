import React from 'react';
import PatientStats from './PatientStats';
import GlucoseChart from './GlucoseChart';
import RiskDistribution from './RiskDistribution';
import AppointmentList from './AppointmentList';
import AlertList from './AlertList';

/**
 * Main Dashboard component that assembles all dashboard widgets
 * @param {Object} props - Component props
 * @param {Object} props.stats - Dashboard statistics
 * @param {Array} props.glucoseData - Glucose trend data for charts
 * @param {Array} props.appointments - Upcoming appointments data
 * @param {Array} props.alerts - Alert data
 * @returns {JSX.Element} Dashboard component
 */
const Dashboard = ({ stats, glucoseData, appointments, alerts }) => {
  // Transform glucose data for the chart if needed
  const transformedGlucoseData = glucoseData || [];
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-sm text-gray-600">ภาพรวมการดูแลผู้ป่วยเบาหวานขณะตั้งครรภ์</p>
      </div>
      
      {/* Stats cards */}
      <PatientStats stats={stats} />
      
      {/* Charts and data visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <GlucoseChart data={transformedGlucoseData} />
        <RiskDistribution data={stats?.patientCounts} />
      </div>
      
      {/* Lists and alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentList appointments={appointments} />
        <AlertList alerts={alerts} />
      </div>
    </div>
  );
};

export default Dashboard;