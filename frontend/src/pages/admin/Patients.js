// src/pages/admin/Patients.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserInjured, FaEdit, FaEye, FaSearch, FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('hospital_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  // ฟังก์ชันดึงข้อมูลผู้ป่วยจาก API
  // ฟังก์ชันดึงข้อมูลผู้ป่วยจาก API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      // เรียกใช้ API จริงเพื่อดึงข้อมูลผู้ป่วย
      const response = await axios.get(`${API_URL}/patients`);
      
      if (response.data && Array.isArray(response.data)) {
        // แปลงข้อมูลให้เข้ากับรูปแบบที่ใช้ในหน้า UI
        const formattedPatients = response.data
          // กรองเฉพาะข้อมูลผู้ป่วย (ตรวจสอบจากข้อมูลที่มี user_id หรือตัวบ่งชี้อื่นๆ)
          .filter(patient => patient.user_id) // หรือใช้เงื่อนไขอื่นๆ ตามโครงสร้างข้อมูลจริง
          .map(patient => {
            // หากมีการใช้ชื่อฟิลด์ที่แตกต่างกัน
            return {
              id: patient.id,
              hospital_id: patient.hospital_id || '',
              first_name: patient.first_name || '',
              last_name: patient.last_name || '',
              phone: patient.phone || '',
              date_of_birth: patient.date_of_birth || null,
              gestational_age: patient.gestational_age_at_diagnosis || null,
              expected_delivery_date: patient.expected_delivery_date || null,
              assigned_nurse_name: patient.nurse_first_name 
                ? `${patient.nurse_first_name} ${patient.nurse_last_name || ''}` 
                : 'ไม่ระบุ',
              status: patient.is_active ? 'active' : 'inactive'
            };
          });
        
        setPatients(formattedPatients);
        setError(null);
      } else {
        throw new Error("ข้อมูลที่ได้รับไม่ถูกต้อง");
      }
    } catch (err) {
      console.error('Error fetching patients data:', err);
      setError('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย: ' + (err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // คำนวณอายุจากวันเกิด
  const calculateAge = (dob) => {
    if (!dob) return 'ไม่ระบุ';
    
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // ฟังก์ชั่นสำหรับการเรียงลำดับ
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  // การกรองและเรียงลำดับข้อมูลตามการค้นหาและการเรียง
  const filteredAndSortedPatients = patients
    .filter(patient => 
      (patient.first_name && patient.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.last_name && patient.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.hospital_id && patient.hospital_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchTerm))
    )
    .sort((a, b) => {
      let valueA, valueB;
      
      // กำหนดค่าที่จะใช้เปรียบเทียบตามฟิลด์ที่เลือก
      switch (sortField) {
        case 'hospital_id':
          valueA = a.hospital_id || '';
          valueB = b.hospital_id || '';
          break;
        case 'name':
          valueA = `${a.first_name || ''} ${a.last_name || ''}`;
          valueB = `${b.first_name || ''} ${b.last_name || ''}`;
          break;
        case 'gestational_age':
          valueA = a.gestational_age || 0;
          valueB = b.gestational_age || 0;
          break;
        case 'expected_delivery_date':
          valueA = a.expected_delivery_date ? new Date(a.expected_delivery_date) : new Date(0);
          valueB = b.expected_delivery_date ? new Date(b.expected_delivery_date) : new Date(0);
          break;
        default:
          valueA = a[sortField] || '';
          valueB = b[sortField] || '';
      }
      
      // เรียงลำดับ
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // คำนวณ pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredAndSortedPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);

  // เปลี่ยนหน้า
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ไอคอนสำหรับการเรียงลำดับ
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortAmountDown className="inline ml-1" /> : <FaSortAmountDownAlt className="inline ml-1" />;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">จัดการผู้ป่วย</h1>
        <p className="text-gray-600">จัดการข้อมูลผู้ป่วยทั้งหมดในระบบ</p>
      </div>

      {/* แสดงข้อความเมื่อเกิดข้อผิดพลาด */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      {/* ส่วนของการค้นหา */}
      <div className="mb-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาผู้ป่วย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* ตารางแสดงข้อมูลผู้ป่วย */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th 
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                  onClick={() => handleSort('hospital_id')}
                >
                  รหัสผู้ป่วย {getSortIcon('hospital_id')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  ชื่อ-นามสกุล {getSortIcon('name')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">อายุ</th>
                <th 
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                  onClick={() => handleSort('gestational_age')}
                >
                  อายุครรภ์ (สัปดาห์) {getSortIcon('gestational_age')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                  onClick={() => handleSort('expected_delivery_date')}
                >
                  กำหนดคลอด {getSortIcon('expected_delivery_date')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">พยาบาลที่ดูแล</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUserInjured className="text-blue-600 mr-2" />
                      <span>{patient.hospital_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.first_name} {patient.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {calculateAge(patient.date_of_birth)} ปี
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.gestational_age || 'ไม่ระบุ'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.expected_delivery_date 
                      ? new Date(patient.expected_delivery_date).toLocaleDateString('th-TH')
                      : 'ไม่ระบุ'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.assigned_nurse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {patient.status === 'active' ? 'กำลังรักษา' : 'สิ้นสุดการรักษา'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/users/${patient.id}/view`}
                        className="text-blue-600 hover:text-blue-900"
                        title="ดูข้อมูล"
                      >
                        <FaEye size={18} />
                      </Link>
                      <Link
                        to={`/admin/users/${patient.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                        title="แก้ไข"
                      >
                        <FaEdit size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {currentPatients.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    {error ? 'เกิดข้อผิดพลาดในการดึงข้อมูล' : 'ไม่พบข้อมูลผู้ป่วยที่ตรงกับการค้นหา'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              &laquo;
            </button>
            {[...Array(totalPages).keys()].map((number) => (
              <button
                key={number + 1}
                onClick={() => paginate(number + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === number + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {number + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;