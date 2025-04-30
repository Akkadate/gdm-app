// src/pages/admin/AssignPatients.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Components
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';

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
      toast.error('ไม่สามารถดึงข้อมูลพยาบาลได้');
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
      toast.error('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
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
      toast.error('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
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
      toast.warning('กรุณาเลือกพยาบาลและผู้ป่วยอย่างน้อย 1 คน');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/patients/batch-assign', {
        nurse_id: selectedNurse,
        patient_ids: selectedPatients
      });

      toast.success(`กำหนดพยาบาลให้ผู้ป่วยจำนวน ${selectedPatients.length} คนเรียบร้อยแล้ว`);
      
      // รีเฟรชข้อมูล
      if (activeTab === 'unassigned') {
        fetchUnassignedPatients();
      } else {
        fetchPatientsByNurse(selectedNurse);
      }
      
      setSelectedPatients([]);
    } catch (error) {
      console.error('Error assigning patients:', error);
      toast.error('ไม่สามารถกำหนดพยาบาลให้ผู้ป่วยได้');
    } finally {
      setLoading(false);
    }
  };

  // ยกเลิกการกำหนดพยาบาลให้ผู้ป่วยที่เลือก
  const removeNurseFromPatients = async () => {
    if (selectedPatients.length === 0) {
      toast.warning('กรุณาเลือกผู้ป่วยอย่างน้อย 1 คน');
      return;
    }

    try {
      setLoading(true);
      
      // ยกเลิกทีละคน
      for (const patientId of selectedPatients) {
        await axios.put(`/api/patients/${patientId}/remove-nurse`);
      }

      toast.success(`ยกเลิกการกำหนดพยาบาลให้ผู้ป่วยจำนวน ${selectedPatients.length} คนเรียบร้อยแล้ว`);
      
      // รีเฟรชข้อมูล
      if (activeTab === 'unassigned') {
        fetchUnassignedPatients();
      } else if (selectedNurse) {
        fetchPatientsByNurse(selectedNurse);
      }
      
      setSelectedPatients([]);
    } catch (error) {
      console.error('Error removing nurse assignment:', error);
      toast.error('ไม่สามารถยกเลิกการกำหนดพยาบาลให้ผู้ป่วยได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">การมอบหมายผู้ป่วยให้พยาบาล</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'unassigned' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => handleTabChange('unassigned')}
          >
            ผู้ป่วยที่ยังไม่มีพยาบาล
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'byNurse' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => handleTabChange('byNurse')}
          >
            ผู้ป่วยตามพยาบาล
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap items-center mb-4 gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกพยาบาล
              </label>
              <select
                className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
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
            
            <div className="w-full md:w-auto flex gap-2 mt-4 md:mt-auto">
              <button
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow"
                onClick={assignPatientsToNurse}
                disabled={!selectedNurse || selectedPatients.length === 0 || loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm mr-2"></span> : null}
                กำหนดพยาบาลให้ผู้ป่วยที่เลือก
              </button>
              
              {activeTab === 'byNurse' && (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md shadow"
                  onClick={removeNurseFromPatients}
                  disabled={selectedPatients.length === 0 || loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm mr-2"></span> : null}
                  ยกเลิกการมอบหมาย
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">กำลังโหลด...</span>
              </div>
            </div>
          ) : (
            <>
              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {activeTab === 'unassigned' 
                    ? 'ไม่มีผู้ป่วยที่ยังไม่ได้รับการมอบหมาย' 
                    : selectedNurse 
                      ? 'ไม่มีผู้ป่วยที่อยู่ในความดูแลของพยาบาลนี้' 
                      : 'กรุณาเลือกพยาบาล'}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedPatients.length === patients.length}
                        onChange={handleSelectAll}
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        เลือกทั้งหมด ({patients.length})
                      </label>
                    </div>
                    <div className="text-sm text-gray-500">
                      เลือกแล้ว {selectedPatients.length} คน
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            รหัสผู้ป่วย
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ชื่อ-นามสกุล
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            วันเกิด
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            กำหนดคลอด
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            เบอร์โทร
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map((patient) => (
                          <tr 
                            key={patient.id}
                            className={selectedPatients.includes(patient.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedPatients.includes(patient.id)}
                                onChange={() => handlePatientSelection(patient.id)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{patient.hospital_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{patient.first_name} {patient.last_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(patient.date_of_birth).toLocaleDateString('th-TH')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {patient.expected_delivery_date 
                                  ? new Date(patient.expected_delivery_date).toLocaleDateString('th-TH') 
                                  : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{patient.phone}</div>
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
