import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Dashboard from '../components/dashboard/Dashboard';
import Loader from '../components/common/Loader';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    patientCounts: { total: 0, high: 0, medium: 0, low: 0 },
    appointmentsToday: 0,
    alertsCount: 0,
    glucoseData: [],
    upcomingAppointments: [],
    alerts: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Parallel API calls to get dashboard data
        const [statsRes, glucoseRes, appointmentsRes, alertsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/glucose-trends'),
          api.get('/dashboard/upcoming-appointments'),
          api.get('/dashboard/alerts')
        ]);
        
        setDashboardData({
          patientCounts: statsRes.data.data.patientCounts,
          appointmentsToday: statsRes.data.data.appointmentsToday,
          alertsCount: statsRes.data.data.alertsCount,
          glucoseData: glucoseRes.data.data,
          upcomingAppointments: appointmentsRes.data.data,
          alerts: alertsRes.data.data
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ โปรดลองอีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          โหลดข้อมูลใหม่
        </button>
      </div>
    );
  }

  return (
    <Dashboard 
      stats={{
        patientCounts: dashboardData.patientCounts,
        appointmentsToday: dashboardData.appointmentsToday,
        alertsCount: dashboardData.alertsCount
      }}
      glucoseData={dashboardData.glucoseData}
      appointments={dashboardData.upcomingAppointments}
      alerts={dashboardData.alerts}
    />
  );
};

export default DashboardPage;