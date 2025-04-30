// src/pages/admin/AssignPatients.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ตรวจสอบว่ามี toast ในโปรเจคหรือไม่ ถ้าไม่มีให้ใช้ alert แทน
const showToast = (message, type = 'success') => {
  if (typeof window.toast !== 'undefined') {
    window.toast[type](message);
  } else {
    alert(message);
  }
};

const AssignPatients = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' or 'byNurse'

  // ดึงข้อมูลพยาบาลทั้งหมด
  const fetchNurses = async () => {
    try {
      const response = await axios.get('/api/users/roles/nurses');
      setNurses(response.data);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      showToast('ไม่สามารถดึงข้อมูลพยาบาลได้', 'error');
    }
  };

  // ดึงข้อมูลผู้ป่วยที่ยังไม่มีพยาบาล
  const fetchUnassignedPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patients/unassigned');
      setUnassignedPatients(response.data);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching unassigned patients:', error);
      showToast('ไม่สามารถดึงข้อมูลผู้ป่วยได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลผู้ป่วยที่ดูแลโดยพยาบาลที่เลือก
  const fetchPatientsByNurse = async (nurseId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/by-nurse/${nurseId}`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients by nurse:', error);
      showToast('ไม่สามารถดึงข้อมูลผู้ป่วยได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // เมื่อโหลดหน้าครั้งแรก
  useEffect(() => {
    fetchNurses();
    fetchUnassignedPatients();
  }, []);

  // เมื่อเปลี่ยนพยาบาล
  useEffect(() => {
    if (selectedNurse && activeTab === 'byNurse') {
      fetchPatientsByNurse(selectedNurse);
      setSelectedPatients([]);
    }
  }, [selectedNurse, activeTab]);

  // เปลี่ยน tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedPatients([]);
    
    if (tab === 'unassigned') {
      fetchUnassignedPatients();
    } else if (tab === 'byNurse' && selectedNurse) {
      fetchPatientsByNurse(selectedNurse);
    } else {
      setPatients([]);
    }
  };

  // เลือกหรือยกเลิกการเลือกผู้ป่วย
  const handlePatientSelection = (patientId) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter(id => id !== patientId));
    } else {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  // เลือกผู้ป่วยทั้งหมด
  const handleSelectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(patient => patient.id));
    }
  };

  // กำหนดพยาบาลให้ผู้ป่วยที่เลือก
  const assignPatientsToNurse = async () => {
    if (!selectedNurse || selectedPatients.length === 0) {
      showToast('กรุณาเลือกพยาบาลและผู้ป่วยอย่างน้อย 1 คน', 'warning');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/patients/batch-assign', {
        nurse_id: selectedNurse,
        patient_ids: selectedPatients
      });

      showToast(`กำหนดพยาบาลให้ผู้ป่วยจำนวน ${selectedPatients.length} คนเรียบร้อยแล้ว`, 'success');
      
      // รีเฟรชข้อมูล
      if (activeTab === 'unassigned') {
        fetchUnassignedPatients();
      } else {
        fetchPatientsByNurse(selectedNurse);
      }
      
      setSelectedPatients([]);
    } catch (error) {
      console.error('Error assigning patients:', error);
      showToast('ไม่สามารถกำหนดพยาบาลให้ผู้ป่วยได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ยกเลิกการกำหนดพยาบาลให้ผู้ป่วยที่เลือก
  const removeNurseFromPatients = async () => {
    if (selectedPatients.length === 0) {
      showToast('กรุณาเลือกผู้ป่วยอย่างน้อย 1 คน', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // ยกเลิกทีละคน
      for (const patientId of selectedPatients) {
        await axios.put(`/api/patients/${patientId}/remove-nurse`);
      }

      showToast(`ยกเลิกการกำหนดพยาบาลให้ผู้ป่วยจำนวน ${selectedPatients.length} คนเรียบร้อยแล้ว`, 'success');
      
      // รีเฟรชข้อมูล
      if (activeTab === 'unassigned') {
        fetchUnassignedPatients();
      } else if (selectedNurse) {
        fetchPatientsByNurse(selectedNurse);
      }
      
      setSelectedPatients([]);
    } catch (error) {
      console.error('Error removing nurse assignment:', error);
      showToast('ไม่สามารถยกเลิกการกำหนดพยาบาลให้ผู้ป่วยได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>การมอบหมายผู้ป่วยให้พยาบาล</h1>
      
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          <button
            style={{ 
              padding: '0.5rem 1rem', 
              fontWeight: '500',
              backgroundColor: activeTab === 'unassigned' ? '#3b82f6' : '#f3f4f6',
              color: activeTab === 'unassigned' ? 'white' : 'inherit'
            }}
            onClick={() => handleTabChange('unassigned')}
          >
            ผู้ป่วยที่ยังไม่มีพยาบาล
          </button>
          <button
            style={{ 
              padding: '0.5rem 1rem', 
              fontWeight: '500',
              backgroundColor: activeTab === 'byNurse' ? '#3b82f6' : '#f3f4f6',
              color: activeTab === 'byNurse' ? 'white' : 'inherit'
            }}
            onClick={() => handleTabChange('byNurse')}
          >
            ผู้ป่วยตามพยาบาล
          </button>
        </div>
        
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                เลือกพยาบาล
              </label>
              <select
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '0.375rem', 
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                value={selectedNurse}
                onChange={(e) => setSelectedNurse(e.target.value)}
              >
                <option value="">-- เลือกพยาบาล --</option>
                {nurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.first_name} {nurse.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ width: '100%', display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  cursor: !selectedNurse || selectedPatients.length === 0 || loading ? 'not-allowed' : 'pointer',
                  opacity: !selectedNurse || selectedPatients.length === 0 || loading ? 0.7 : 1
                }}
                onClick={assignPatientsToNurse}
                disabled={!selectedNurse || selectedPatients.length === 0 || loading}
              >
                {loading ? 'กำลังดำเนินการ...' : 'กำหนดพยาบาลให้ผู้ป่วยที่เลือก'}
              </button>
              
              {activeTab === 'byNurse' && (
                <button
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    cursor: selectedPatients.length === 0 || loading ? 'not-allowed' : 'pointer',
                    opacity: selectedPatients.length === 0 || loading ? 0.7 : 1
                  }}
                  onClick={removeNurseFromPatients}
                  disabled={selectedPatients.length === 0 || loading}
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยกเลิกการมอบหมาย'}
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
              <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 2s linear infinite' }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <>
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {activeTab === 'unassigned' 
                    ? 'ไม่มีผู้ป่วยที่ยังไม่ได้รับการมอบหมาย' 
                    : selectedNurse 
                      ? 'ไม่มีผู้ป่วยที่อยู่ในความดูแลของพยาบาลนี้' 
                      : 'กรุณาเลือกพยาบาล'}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        style={{ height: '1rem', width: '1rem', borderRadius: '0.25rem', marginRight: '0.5rem' }}
                        checked={selectedPatients.length === patients.length}
                        onChange={handleSelectAll}
                      />
                      <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        เลือกทั้งหมด ({patients.length})
                      </label>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      เลือกแล้ว {selectedPatients.length} คน
                    </div>
                  </div>
                  
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ width: '3rem', padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            
                          </th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            รหัสผู้ป่วย
                          </th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ชื่อ-นามสกุล
                          </th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            วันเกิด
                          </th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            กำหนดคลอด
                          </th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            เบอร์โทร
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white', divide: 'y' }}>
                        {patients.map((patient) => (
                          <tr 
                            key={patient.id}
                            style={{ 
                              backgroundColor: selectedPatients.includes(patient.id) ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                            onClick={() => handlePatientSelection(patient.id)}
                          >
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <input
                                type="checkbox"
                                style={{ height: '1rem', width: '1rem', borderRadius: '0.25rem' }}
                                checked={selectedPatients.includes(patient.id)}
                                onChange={() => {}} // การเปลี่ยนแปลงจะถูกจัดการโดยการคลิกที่แถว
                              />
                            </td>
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{patient.hospital_id}</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.875rem', color: '#111827' }}>{patient.first_name} {patient.last_name}</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('th-TH') : '-'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {patient.expected_delivery_date 
                                  ? new Date(patient.expected_delivery_date).toLocaleDateString('th-TH') 
                                  : '-'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{patient.phone}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignPatients;
