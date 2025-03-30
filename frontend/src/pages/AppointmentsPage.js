import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO, isValid, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';

import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import AppointmentForm from '../components/appointments/AppointmentForm';
import Loader from '../components/common/Loader';

import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import appointmentService from '../services/appointmentService';
import patientService from '../services/patientService';
import userService from '../services/userService';

/**
 * Appointments Page component
 * For viewing and managing appointments
 * @returns {JSX.Element} Appointments page
 */
const AppointmentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: showError } = useAlert();
  const { currentUser } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar', 'list', or 'form'
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const patientId = searchParams.get('patient');
    const dateParam = searchParams.get('date');
    
    // If patient ID is provided, load patient data
    if (patientId) {
      const fetchPatient = async () => {
        try {
          const patientData = await patientService.getPatient(patientId);
          setSelectedPatient(patientData);
          setIsAdding(true);
        } catch (err) {
          console.error('Error fetching patient:', err);
        }
      };
      
      fetchPatient();
    }
    
    // If date is provided, set it as selected date
    if (dateParam) {
      const parsedDate = parseISO(dateParam);
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
        setCurrentMonth(parsedDate);
      }
    }
  }, [location.search]);
  
  // Fetch appointments for the current month
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        // Define date range for the current month
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        
        // Create query parameters
        const params = {
          start_date: start,
          end_date: end
        };
        
        // Add provider filter if user is a doctor
        if (currentUser && currentUser.role === 'doctor') {
          params.provider_id = currentUser.id;
        }
        
        // Fetch appointments
        const response = await appointmentService.getAppointments(params);
        setAppointments(response.data);
        setFilteredAppointments(response.data);
        
        // Load patients and providers for the form
        const [patientsData, providersData] = await Promise.all([
          patientService.getPatients({ limit: 100 }),
          userService.getProviders()
        ]);
        
        setPatients(patientsData.data);
        setProviders(providersData);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        showError(err.message || 'ไม่สามารถโหลดข้อมูลการนัดหมายได้');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [currentMonth, currentUser, showError]);
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle creating or updating an appointment
  const handleSaveAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      
      let savedAppointment;
      if (isEditing && currentAppointment) {
        // Update existing appointment
        savedAppointment = await appointmentService.updateAppointment(
          currentAppointment.id,
          appointmentData
        );
        
        // Update appointment in state
        setAppointments(prevAppointments => 
          prevAppointments.map(appointment => 
            appointment.id === savedAppointment.id ? savedAppointment : appointment
          )
        );
        
        success('อัปเดตการนัดหมายเรียบร้อยแล้ว');
      } else {
        // Create new appointment
        savedAppointment = await appointmentService.createAppointment(appointmentData);
        
        // Add new appointment to state
        setAppointments(prevAppointments => [...prevAppointments, savedAppointment]);
        
        success('สร้างการนัดหมายเรียบร้อยแล้ว');
      }
      
      // Reset form state
      setIsAdding(false);
      setIsEditing(false);
      setCurrentAppointment(null);
      setSelectedPatient(null);
      setCurrentView('calendar');
      
      // Clear URL parameters
      navigate('/appointments');
    } catch (err) {
      console.error('Error saving appointment:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการนัดหมาย');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting an appointment
  const handleDeleteAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      
      // Delete appointment from API
      await appointmentService.deleteAppointment(appointmentId);
      
      // Remove appointment from state
      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== appointmentId)
      );
      
      success('ลบการนัดหมายเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการลบการนัดหมาย');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting an appointment
  const handleSelectAppointment = (appointment) => {
    setCurrentAppointment(appointment);
    setIsEditing(true);
    setCurrentView('form');
  };
  
  // Handle selecting a date for a new appointment
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setIsAdding(true);
    setCurrentView('form');
  };
  
  // Format month name for display
  const formatMonthYear = (date) => {
    return format(date, 'MMMM yyyy', { locale: th });
  };
  
  // Render content based on current view
  const renderContent = () => {
    if (loading) {
      return <Loader />;
    }
    
    if (currentView === 'form' || isAdding || isEditing) {
      return (
        <AppointmentForm 
          appointment={currentAppointment}
          patients={patients}
          providers={providers}
          onSave={handleSaveAppointment}
          onCancel={() => {
            setIsAdding(false);
            setIsEditing(false);
            setCurrentAppointment(null);
            setSelectedPatient(null);
            setCurrentView('calendar');
            navigate('/appointments');
          }}
          loading={loading}
          initialPatient={selectedPatient}
          initialDate={selectedDate}
        />
      );
    }
    
    return (
      <div className="bg-white shadow rounded-lg">
        {/* Calendar header with month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {formatMonthYear(currentMonth)}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            >
              วันนี้
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Appointment calendar */}
        <AppointmentCalendar 
          appointments={filteredAppointments}
          onSelectDate={handleSelectDate}
          onSelectAppointment={handleSelectAppointment}
          onAddAppointment={(date) => {
            setSelectedDate(date);
            setIsAdding(true);
            setCurrentView('form');
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">
          การนัดหมาย
        </h1>
        
        {currentView !== 'form' && !isAdding && !isEditing && (
          <button
            onClick={() => {
              setIsAdding(true);
              setCurrentView('form');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            สร้างการนัดหมาย
          </button>
        )}
      </div>
      
      {/* Main content */}
      {renderContent()}
    </div>
  );
};

export default AppointmentsPage;