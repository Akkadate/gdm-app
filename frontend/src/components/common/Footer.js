import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white py-4 px-6 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-gray-500 mb-2 md:mb-0">
          &copy; {currentYear} GDM Care. สงวนลิขสิทธิ์.
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <span>พัฒนาด้วย</span>
          <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" />
          <span>เพื่อสุขภาพแม่และลูก</span>
        </div>
        
        <div className="text-sm text-gray-500 mt-2 md:mt-0">
          <span className="mr-4">เวอร์ชัน 1.0.0</span>
          <a href="/privacy" className="hover:text-blue-600 mr-4">นโยบายความเป็นส่วนตัว</a>
          <a href="/terms" className="hover:text-blue-600">ข้อกำหนดการใช้งาน</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;