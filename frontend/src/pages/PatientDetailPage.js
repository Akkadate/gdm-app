import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Activity, Calendar, FileText, ArrowLeft, ChevronRight } from 'lucide-react';

import PatientDetail from '../components/patients/PatientDetail';
import PatientForm from '../components/patients/PatientForm';
import GlucoseTracker from '../components/glucose/GlucoseTracker';
import GlucoseEntryForm from '../components/glucose/GlucoseEntryForm';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import Loader from '../components/common/Loader';

import { useAlert } from '../contexts/AlertContext';
import patientService from '../services/patientService';
import glucoseService from '../services/glucoseService';
import appointmentService from '../services/appointmentService';
import userService from '../services/userService';

/**
 * Patient Detail Page component
 * Handles viewing and editing patient details, glucose readings, and appointments
 * @returns {JSX.Element} Patient detail page
 */
const PatientDetailPage = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useAlert();
  
  const [activeTab, setActiveTab] = useState('details');
  const [patient, setPatient] = useState(null);
  const [glucoseReadings, setGlucoseReadings] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [editing, setEditing] = useState(isNew);
  const [addingGlucose, setAddingGlucose] = useState(false);
  const [glucoseToEdit, setGlucoseToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch patient data and related info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load healthcare providers for forms
        const providersData = await userService.getProviders();
        setProviders(providersData);
        
        // Skip patient data loading if creating new patient
        if (isNew) {
          setLoading(false);
          return;
        }
        
        // Load patient data
        const patientData = await patientService.getPatient(id);
        setPatient(patientData);
        
        // Load related data
        const [glucoseData, appointmentsData] = await Promise.all([
          glucoseService.getPatientReadings(id),
          appointmentService.getPatientAppointments(id)
        ]);
        
        setGlucoseReadings(glucoseData.data);
        setAppointments(appointmentsData.data);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        showError(err.message || 'ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isNew, showError]);
  
  // Handle save patient (create or update)
  const handleSavePatient = async (patientData) => {
    try {
      setLoading(true);
      
      let savedPatient;
      if (isNew) {
        // Create new patient
        savedPatient = await patientService.createPatient(patientData);
        success('สร้างข้อมูลผู้ป่วยเรียบร้อยแล้ว');
        
        // Navigate to new patient's page
        navigate(`/patients/${savedPatient.id}`);
      } else {
        // Update existing patient
        savedPatient = await patientService.updatePatient(id, patientData);
        setPatient(savedPatient);
        setEditing(false);
        success('อัปเดตข้อมูลผู้ป่วยเรียบร้อยแล้ว');
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ป่วย');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle risk assessment
  const handleRiskAssess = async (riskData) => {
    try {
      setLoading(true);
      
      // Use risk assessment API endpoint
      const updatedPatient = await patientService.calculateRisk(id);
      setPatient(updatedPatient);
      success('ประเมินความเสี่ยงเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error assessing risk:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการประเมินความเสี่ยง');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle save glucose reading
  const handleSaveGlucoseReading = async (glucoseData) => {
    try {
      setLoading(true);
      
      let savedReading;
      if (glucoseToEdit) {
        // Update existing reading
        savedReading = await glucoseService.updateReading(glucoseToEdit.id, glucoseData);
        
        // Update reading in state
        setGlucoseReadings(prevReadings => 
          prevReadings.map(reading => 
            reading.id === savedReading.id ? savedReading : reading
          )
        );
        
        success('อัปเดตค่าระดับน้ำตาลเรียบร้อยแล้ว');
      } else {
        // Create new reading
        savedReading = await glucoseService.createReading(glucoseData);
        
        // Add new reading to state
        setGlucoseReadings(prevReadings => [...prevReadings, savedReading]);
        
        success('บันทึกค่าระดับน้ำตาลเรียบร้อยแล้ว');
      }
      
      // Reset form state
      setAddingGlucose(false);
      setGlucoseToEdit(null);
    } catch (err) {
      console.error('Error saving glucose reading:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการบันทึกค่าระดับน้ำตาล');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete glucose reading
  const handleDeleteGlucoseReading = async (readingId) => {
    try {
      setLoading(true);
      
      // Delete reading from API
      await glucoseService.deleteReading(readingId);
      
      // Remove reading from state
      setGlucoseReadings(prevReadings => 
        prevReadings.filter(reading => reading.id !== readingId)
      );
      
      success('ลบค่าระดับน้ำตาลเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error deleting glucose reading:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการลบค่าระดับน้ำตาล');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle appointment creation
  const handleAddAppointment = (selectedDate) => {
    navigate(`/appointments/add?patient=${id}&date=${selectedDate.toISOString().split('T')[0]}`);
  };
  
  // Handle appointment selection
  const handleSelectAppointment = (appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };
  
  // Render content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return <Loader />;
    }
    
    if (editing) {
      return (
        <PatientForm 
          patient={isNew ? null : patient}
          providers={providers}
          onSave={handleSavePatient}
          onCancel={() => {
            if (isNew) {
              navigate('/patients');
            } else {
              setEditing(false);
            }
          }}
          loading={loading}
        />
      );
    }
    
    if (addingGlucose || glucoseToEdit) {
      return (
        <GlucoseEntryForm 
          glucoseReading={glucoseToEdit}
          patient={patient}
          onSave={handleSaveGlucoseReading}
          onCancel={() => {
            setAddingGlucose(false);
            setGlucoseToEdit(null);
          }}
          loading={loading}
        />
      );
    }
    
    switch (activeTab) {
      case 'glucose':
        return (
          <GlucoseTracker 
            readings={glucoseReadings}
            patient={patient}
            onAddReading={() => setAddingGlucose(true)}
            onDeleteReading={handleDeleteGlucoseReading}
            loading={loading}
          />
        );
      case 'appointments':
        return (
          <AppointmentCalendar 
            appointments={appointments}
            onSelectDate={handleAddAppointment}
            onSelectAppointment={handleSelectAppointment}
            onAddAppointment={handleAddAppointment}
          />
        );
      case 'details':
      default:
        return (
          <PatientDetail 
            patient={patient}
            glucoseReadings={glucoseReadings}
            appointments={appointments}
            onRiskAssess={handleRiskAssess}
          />
        );
    }
  };
  
  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center mb-2 md:mb-0">
          <Link to="/patients" className="text-gray-500 hover:text-gray-700 mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'เพิ่มผู้ป่วยใหม่' : editing ? 'แก้ไขข้อมูลผู้ป่วย' : 'ข้อมูลผู้ป่วย'}
          </h1>
        </div>
        
        {/* Edit button - only show when viewing patient details */}
        {!isNew && !editing && !addingGlucose && !glucoseToEdit && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            แก้ไขข้อมูล
          </button>
        )}
      </div>
      
      {/* Breadcrumbs */}
      {!isNew && patient && !editing && !addingGlucose && !glucoseToEdit && (
        <div className="mb-4 flex items-center text-sm text-gray-500">
          <Link to="/patients" className="hover:text-blue-600">รายชื่อผู้ป่วย</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</span>
        </div>
      )}
      
      {/* Tabs - Only show tabs when not editing */}
      {!isNew && !editing && !addingGlucose && !glucoseToEdit && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block h-5 w-5 mr-1" />
              ข้อมูลทั่วไป
            </button>
            
            <button
              onClick={() => setActiveTab('glucose')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'glucose'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="inline-block h-5 w-5 mr-1" />
              ค่าระดับน้ำตาล
            </button>
            
            <button
              onClick={() => setActiveTab('appointments')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline-block h-5 w-5 mr-1" />
              การนัดหมาย
            </button>
            
            <button
              onClick={() => setActiveTab('notes')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="inline-block h-5 w-5 mr-1" />
              บันทึกทางคลินิก
            </button>
          </nav>
        </div>
      )}
      
      {/* Main content */}
      {renderTabContent()}
    </div>
  );
};

export default PatientDetailPage;