import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaExclamationCircle } from 'react-icons/fa';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortField, setSortField] = useState('last_name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเปลี่ยนฟิลด์ที่ใช้เรียงลำดับ
  const handleSort = (field) => {
    if (field === sortField) {
      // ถ้าคลิกที่ฟิลด์เดิม ให้สลับทิศทางการเรียง
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // ถ้าคลิกฟิลด์ใหม่ ให้เรียงจากน้อยไปมาก
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ฟังก์ชันกรองและเรียงลำดับข้อมูล
  const filteredAndSortedPatients = () => {
    return [...patients]
      // กรองตามคำค้นหา
      .filter(patient => {
        const searchString = `${patient.first_name} ${patient.last_name} ${patient.hospital_id}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      })
      // กรองตามสถานะ
      .filter(patient => {
        if (filterStatus === 'all') return true;
        return filterStatus === 'active' ? patient.is_active : !patient.is_active;
      })
      // เรียงลำดับ
      .sort((a, b) => {
        let valueA, valueB;
        
        // ดึงค่าตามฟิลด์ที่ต้องการเรียง
        if (sortField === 'name') {
          valueA = `${a.last_name} ${a.first_name}`.toLowerCase();
          valueB = `${b.last_name} ${b.first_name}`.toLowerCase();
        } else if (sortField === 'hospital_id') {
          valueA = a.hospital_id;
          valueB = b.hospital_id;
        } else if (sortField === 'readings_today') {
          valueA = a.readings_today || 0;
          valueB = b.readings_today || 0;
        } else if (sortField === 'upcoming_appointments') {
          valueA = a.upcoming_appointments || 0;
          valueB = b.upcoming_appointments || 0;
        } else {
          valueA = a[sortField];
          valueB = b[sortField];
        }
        
        // เรียงลำดับตามทิศทางที่กำหนด
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  };

  // เพิ่มตัวบ่งชี้การเรียงลำดับ (เช่น ลูกศรขึ้น/ลง)
  const getSortIndicator = (field) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl font-semibold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">รายชื่อผู้ป่วย</h1>
      
      {/* แถบค้นหาและตัวกรอง */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center w-full md:w-1/2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="ค้นหาผู้ป่วย..."
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งานอยู่</option>
                <option value="inactive">ไม่ได้ใช้งาน</option>
              </select>
            </div>
            
            <button
              onClick={fetchPatients}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      </div>
      
      {/* ตารางรายชื่อผู้ป่วย */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  ชื่อ-นามสกุล {getSortIndicator('name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('hospital_id')}
                >
                  เลขประจำตัว {getSortIndicator('hospital_id')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('readings_today')}
                >
                  บันทึกวันนี้ {getSortIndicator('readings_today')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('upcoming_appointments')}
                >
                  การนัดหมาย {getSortIndicator('upcoming_appointments')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedPatients().length > 0 ? (
                filteredAndSortedPatients().map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {patient.has_abnormal_reading && (
                          <FaExclamationCircle className="text-red-500 mr-2" title="มีค่าน้ำตาลผิดปกติ" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</div>
                          <div className="text-sm text-gray-500">โทร: {patient.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.hospital_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.readings_today || 0} ครั้ง
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.upcoming_appointments || 0} รายการ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.is_active ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        to={`/nurse/patients/${patient.id}`}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        ดูข้อมูล
                      </Link>
                      <Link
                        to={`/nurse/patients/${patient.id}/glucose`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดูค่าน้ำตาล
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูลผู้ป่วย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            แสดง {filteredAndSortedPatients().length} รายการ จากทั้งหมด {patients.length} รายการ
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientList;