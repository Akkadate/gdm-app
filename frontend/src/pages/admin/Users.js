// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserShield, FaUserNurse, FaUserInjured, FaEdit, FaTrash, FaPlus, FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // ในระบบจริงควรมี API endpoint สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`);
        setUsers(response.data || []);
      } catch (error) {
        console.error('Error fetching users data:', error);
        // กรณีไม่มี API สำหรับข้อมูลนี้ยังคงแสดงข้อมูลตัวอย่าง
        setUsers([
          { 
            id: 1, 
            hospital_id: 'A001', 
            first_name: 'สมชาย', 
            last_name: 'ผู้ดูแล', 
            phone: '081-999-9999', 
            role: 'admin',
            is_active: true,
            created_at: '2023-01-01'
          },
          { 
            id: 2, 
            hospital_id: 'N001', 
            first_name: 'สมศรี', 
            last_name: 'มีใจดี', 
            phone: '081-234-5678', 
            role: 'nurse',
            is_active: true,
            created_at: '2023-01-15'
          },
          { 
            id: 3, 
            hospital_id: 'N002', 
            first_name: 'วิมล', 
            last_name: 'ใจดีมาก', 
            phone: '082-345-6789', 
            role: 'nurse',
            is_active: true,
            created_at: '2023-02-20'
          },
          { 
            id: 4, 
            hospital_id: 'P001', 
            first_name: 'สมหญิง', 
            last_name: 'ใจดี', 
            phone: '081-111-1111',
            role: 'patient',
            is_active: true,
            created_at: '2023-03-10'
          },
          { 
            id: 5, 
            hospital_id: 'P002', 
            first_name: 'วรรณา', 
            last_name: 'สุขใจ', 
            phone: '082-222-2222',
            role: 'patient',
            is_active: true,
            created_at: '2023-03-15'
          },
          { 
            id: 6, 
            hospital_id: 'P003', 
            first_name: 'ศิริพร', 
            last_name: 'ดีงาม', 
            phone: '083-333-3333',
            role: 'patient',
            is_active: false,
            created_at: '2023-04-05'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // ฟังก์ชั่นสำหรับการลบผู้ใช้
  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      try {
        // ในระบบจริงควรส่งคำขอไปยัง API
        // await axios.delete(`${process.env.REACT_APP_API_URL}/users/${id}`);
        
        // อัปเดตข้อมูลในสถานะ
        setUsers(users.filter(user => user.id !== id));
        toast.success('ลบผู้ใช้สำเร็จ');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้');
      }
    }
  };

  // รับไอคอนตามบทบาทของผู้ใช้
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-purple-600" />;
      case 'nurse':
        return <FaUserNurse className="text-green-600" />;
      case 'patient':
        return <FaUserInjured className="text-blue-600" />;
      default:
        return null;
    }
  };

  // แปลบทบาทเป็นภาษาไทย
  const translateRole = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'nurse':
        return 'พยาบาล';
      case 'patient':
        return 'ผู้ป่วย';
      default:
        return role;
    }
  };

  // การกรองข้อมูลตามการค้นหาและบทบาท
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.hospital_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // คำนวณ pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
        <h1 className="text-2xl font-bold mb-2">จัดการผู้ใช้งาน</h1>
        <p className="text-gray-600">จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ</p>
      </div>

      {/* ส่วนของการค้นหาและตัวกรอง */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="relative mb-4 md:mb-0 md:w-1/3">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <div className="flex space-x-2 mb-4 md:mb-0">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="nurse">พยาบาล</option>
            <option value="patient">ผู้ป่วย</option>
          </select>
          
          <Link
            to="/admin/users/new"
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            เพิ่มผู้ใช้ใหม่
          </Link>
        </div>
      </div>

      {/* ตารางแสดงข้อมูลผู้ใช้ */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">รหัสผู้ใช้</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">เบอร์ติดต่อ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">บทบาท</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วันที่เพิ่ม</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2">{user.hospital_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {translateRole(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/users/${user.id}/view`}
                        className="text-blue-600 hover:text-blue-900"
                        title="ดูข้อมูล"
                      >
                        <FaEye size={18} />
                      </Link>
                      <Link
                        to={`/admin/users/${user.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                        title="แก้ไข"
                      >
                        <FaEdit size={18} />
                      </Link>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="ลบ"
                        >
                          <FaTrash size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา
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

export default Users;