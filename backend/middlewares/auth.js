const jwt = require('jsonwebtoken');

// Middleware สำหรับตรวจสอบการเข้าสู่ระบบ
const auth = (req, res, next) => {
  // อ่าน token จาก header
  const token = req.header('x-auth-token');
  
  // ตรวจสอบว่ามี token หรือไม่
  if (!token) {
    return res.status(401).json({ message: 'ไม่พบ token, การอนุญาตถูกปฏิเสธ' });
  }
  
  try {
    // ตรวจสอบความถูกต้องของ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // เพิ่มข้อมูลผู้ใช้ลงใน request
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
  }
};

// Middleware สำหรับตรวจสอบว่าเป็นพยาบาลหรือแอดมิน
const authNurseOrAdmin = async (req, res, next) => {
  try {
    // ตรวจสอบการเข้าสู่ระบบก่อน
    auth(req, res, async () => {
      // ตรวจสอบบทบาทจากฐานข้อมูล
      const result = await req.db.query(
        'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [req.user.id]
      );
      
      const role = result.rows[0]?.name;
      
      if (role === 'nurse' || role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'ไม่มีสิทธิ์ในการเข้าถึง จำเป็นต้องเป็นพยาบาลหรือแอดมิน' });
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
  }
};

// Middleware สำหรับตรวจสอบว่าเป็นแอดมินเท่านั้น
const authAdmin = async (req, res, next) => {
  try {
    // ตรวจสอบการเข้าสู่ระบบก่อน
    auth(req, res, async () => {
      // ตรวจสอบบทบาทจากฐานข้อมูล
      const result = await req.db.query(
        'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [req.user.id]
      );
      
      const role = result.rows[0]?.name;
      
      if (role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'ไม่มีสิทธิ์ในการเข้าถึง จำเป็นต้องเป็นแอดมิน' });
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
  }
};

module.exports = { auth, authNurseOrAdmin, authAdmin };