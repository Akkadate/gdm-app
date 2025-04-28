// src/pages/admin/Nurses.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserNurse, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';

const Nurses = () => {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNurses();
  }, []);

  // ฟังก์ชันดึงข้อมูลพยาบาลจาก API
  const fetchNurses = async () => {
    try {
      setLoading(true);
      // เรียกใช้ API จริง
      const response = await axios.get(`${API_URL}/users?role=nurse`);
      
      // จัดรูปแบบข้อมูลให้สอดคล้องกับการใช้งาน
      const formattedNurses = response.data.map(nurse => {
        // ตรวจสอบและกำหนดค่า patient_count หากไม่มีในข้อมูลจาก API
        if (!nurse.patient_count && nurse.patient_count !== 0) {
          // หากไม่มีข้อมูล patient_count ให้ดึงจาก endpoints อื่น
          // หรือกำหนดเป็น 0 ไปก่อน ให้สอดคล้องกับโครงสร้างเดิม
          nurse.patient_count = 0;
        }
        
        return nurse;
      });
      
      setNurses(formattedNurses);
      setError(null);
    } catch (err) {
      console.error('Error fetching nurses data:', err);
      setError('ไม่สามารถดึงข้อมูลพยาบาลได้');
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลพยาบาล');
      // กรณีเกิดข้อผิดพลาด ให้ใช้ข้อมูลตัวอย่างแทน (เพื่อให้ UI ยังใช้งานได้)
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการลบพยาบาล
  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลพยาบาลคนนี้?')) {
      try {
        // เรียกใช้ API จริง
        await axios.delete(`${API_URL}/users/${id}`);
        
        // อัปเดตข้อมูลในสถานะ
        setNurses(nurses.filter(nurse => nurse.id !== id));
        toast.success('ลบข้อมูลพยาบาลสำเร็จ');
      } catch (error) {
        console.error('Error deleting nurse:', error);
        toast.error('เกิดข้อผิดพลาดในการลบข้อมูล: ' + (error.response?.data?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'));
      }
    }
  };

  // การกรองข้อมูลตามการค้นหา
  const filteredNurses = nurses.filter(nurse => 
    (nurse.first_name && nurse.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nurse.last_name && nurse.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nurse.hospital_id && nurse.hospital_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nurse.phone && nurse.phone.includes(searchTerm))
  );

  // คำนวณ pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNurses = filteredNurses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNurses.length / itemsPerPage);

  // เปลี่ยนหน้า
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        <h1 className="text-2xl font-bold mb-2">จัดการพยาบาล</h1>
        <p className="text-gray-600">จัดการข้อมูลพยาบาลในระบบ</p>
      </div>

      {/* แสดงข้อความเมื่อเกิดข้อผิดพลาด */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      {/* ส่วนของการค้นหาและปุ่มเพิ่มพยาบาล */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="relative mb-4 md:mb-0 md:w-1/3">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาพยาบาล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <Link
          to="/admin/nurses/new"
          className="flex items-center justify-center md:justify-start bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          เพิ่มพยาบาลใหม่
        </Link>
      </div>

      {/* ตารางแสดงข้อมูลพยาบาล */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">รหัสพยาบาล</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เบอร์ติดต่อ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">จำนวนผู้ป่วย</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วันที่เพิ่ม</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentNurses.map((nurse) => (
                <tr key={nurse.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUserNurse className="text-green-600 mr-2" />
                      <span>{nurse.hospital_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nurse.first_name} {nurse.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{nurse.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{nurse.patient_count || 0} คน</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      nurse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {nurse.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nurse.created_at ? new Date(nurse.created_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/nurses/${nurse.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(nurse.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentNurses.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {error ? 'เกิดข้อผิดพลาดในการดึงข้อมูล' : 'ไม่พบข้อมูลพยาบาลที่ตรงกับการค้นหา'}
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

export default Nurses;