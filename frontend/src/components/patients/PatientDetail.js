import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Edit, 
  Activity, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  Clock,
  Users,
  Heart,
  ArrowRight
} from 'lucide-react';
import RiskAssessment from './RiskAssessment';

const PatientDetail = ({ patient, glucoseReadings, appointments, clinicalNotes, onRiskAssess }) => {
  const [showRiskModal, setShowRiskModal] = useState(false);
  
  if (!patient) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-500">เลือกผู้ป่วยเพื่อดูข้อมูล</p>
      </div>
    );
  }
  
  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Get risk level badge color
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
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get remaining weeks until delivery
  const getRemainingWeeks = () => {
    if (!patient.estimated_delivery_date) return null;
    
    const today = new Date();
    const delivery = new Date(patient.estimated_delivery_date);
    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.floor(diffDays / 7));
  };
  
  const remainingWeeks = getRemainingWeeks();
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Patient header with personal info and risk level */}
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="mt-1 text-sm text-gray-500 flex flex-wrap items-center gap-x-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  รหัสผู้ป่วย: {patient.medical_record_number}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  อายุ: {calculateAge(patient.date_of_birth)} ปี
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(patient.risk_level)}`}>
                {patient.risk_level === 'high' ? 'ความเสี่ยงสูง' : 
                 patient.risk_level === 'medium' ? 'ความเสี่ยงปานกลาง' : 'ความเสี่ยงต่ำ'}
              </span>
              <Link to={`/patients/edit/${patient.id}`} className="ml-2 text-blue-600 hover:text-blue-800">
                <Edit className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ข้อมูลการติดต่อ</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{patient.phone_number || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{patient.email || '-'}</span>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span>{patient.address || '-'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">ข้อมูลการตั้งครรภ์</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span>กำหนดคลอด: {formatDate(patient.estimated_delivery_date) || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>อายุครรภ์: {patient.weeks_pregnant ? `${patient.weeks_pregnant} สัปดาห์` : '-'}</span>
                </div>
                {remainingWeeks !== null && (
                  <div className="flex items-center text-sm">
                    <Heart className="h-4 w-4 text-gray-400 mr-2" />
                    <span>คงเหลือ: {remainingWeeks} สัปดาห์</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Risk factors and assessment */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">ปัจจัยเสี่ยง</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {patient.risk_factors && patient.risk_factors.length > 0 ? (
                patient.risk_factors.map((factor, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {factor}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">ไม่พบปัจจัยเสี่ยง</span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowRiskModal(true)}
            className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            ประเมินความเสี่ยง
          </button>
        </div>
      </div>
      
      {/* Quick statistics */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">BMI ก่อนตั้งครรภ์</h4>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {patient.bmi ? patient.bmi.toFixed(1) : '-'}
              </p>
              <p className="ml-1 text-sm text-gray-500">kg/m²</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">ค่าน้ำตาลเฉลี่ย</h4>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {glucoseReadings && glucoseReadings.length > 0 
                  ? (glucoseReadings.reduce((sum, reading) => sum + reading.glucose_value, 0) / glucoseReadings.length).toFixed(0)
                  : '-'
                }
              </p>
              <p className="ml-1 text-sm text-gray-500">mg/dL</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">นัดหมายถัดไป</h4>
            <div className="mt-1">
              {appointments && appointments.length > 0 ? (
                <p className="text-sm text-gray-900">{formatDate(appointments[0].appointment_date)}</p>
              ) : (
                <p className="text-sm text-gray-500">ไม่มีนัดหมาย</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">บันทึกล่าสุด</h4>
            <div className="mt-1">
              {clinicalNotes && clinicalNotes.length > 0 ? (
                <p className="text-sm text-gray-900">{formatDate(clinicalNotes[0].note_date)}</p>
              ) : (
                <p className="text-sm text-gray-500">ไม่มีบันทึก</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">การดำเนินการ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link
            to={`/glucose/add/${patient.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Activity className="mr-2 h-4 w-4" />
            เพิ่มค่าน้ำตาล
          </Link>
          
          <Link
            to={`/appointments/add/${patient.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            สร้างนัดหมาย
          </Link>
          
          <Link
            to={`/clinical-notes/add/${patient.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <FileText className="mr-2 h-4 w-4" />
            บันทึกทางคลินิก
          </Link>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link
            to={`/patients/${patient.id}/full-view`}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            ดูข้อมูลเพิ่มเติม
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      {/* Risk Assessment Modal */}
      {showRiskModal && (
        <RiskAssessment 
          patient={patient}
          onClose={() => setShowRiskModal(false)}
          onAssess={onRiskAssess}
        />
      )}
    </div>
  );
};

export default PatientDetail;