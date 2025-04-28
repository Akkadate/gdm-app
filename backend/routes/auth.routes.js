const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { auth } = require("../middlewares/auth");

// @route   POST api/auth/register
// @desc    ลงทะเบียนผู้ใช้ใหม่
// @access  Public
router.post(
  "/register",
  [
    check("hospital_id", "กรุณาระบุเลขประจำตัวผู้ป่วย").not().isEmpty(),
    check("first_name", "กรุณาระบุชื่อ").not().isEmpty(),
    check("last_name", "กรุณาระบุนามสกุล").not().isEmpty(),
    check("phone", "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง").matches(/^[0-9]{10}$/),
    check("password", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      hospital_id,
      first_name,
      last_name,
      phone,
      password,
      date_of_birth,
    } = req.body;

    try {
      // ตรวจสอบว่าเลขประจำตัวผู้ป่วยซ้ำหรือไม่
      const userExists = await req.db.query(
        "SELECT * FROM users WHERE hospital_id = $1",
        [hospital_id]
      );

      if (userExists.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "เลขประจำตัวผู้ป่วยนี้มีในระบบแล้ว" });
      }

      // แปลงรหัสผ่านเป็น hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // เพิ่มผู้ใช้ใหม่
      const result = await req.db.query(
        "INSERT INTO users (hospital_id, first_name, last_name, phone, password, role_id) VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE name = $6)) RETURNING id, hospital_id, first_name, last_name, phone",
        [hospital_id, first_name, last_name, phone, hashedPassword, "patient"]
      );

      const newUser = result.rows[0];

      // หากมีข้อมูลวันเกิด ให้บันทึกข้อมูลผู้ป่วยด้วย
      if (date_of_birth) {
        await req.db.query(
          "INSERT INTO patients (user_id, date_of_birth) VALUES ($1, $2)",
          [newUser.id, date_of_birth]
        );
      }

      // สร้าง JWT token
      const payload = {
        user: {
          id: newUser.id,
          hospital_id: newUser.hospital_id,
          role: "patient",
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: newUser });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   POST api/auth/login
// @desc    เข้าสู่ระบบและรับ token
// @access  Public
router.post(
  "/login",
  [
    check("hospital_id", "กรุณาระบุเลขประจำตัวผู้ป่วย").exists(),
    check("password", "กรุณาระบุรหัสผ่าน").exists(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hospital_id, password } = req.body;

    try {
      // ค้นหาผู้ใช้จากเลขประจำตัวผู้ป่วย
      const result = await req.db.query(
        "SELECT u.id, u.hospital_id, u.first_name, u.last_name, u.phone, u.password, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.hospital_id = $1",
        [hospital_id]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(400).json({ message: "ไม่พบผู้ใช้งานในระบบ" });
      }

      // ตรวจสอบรหัสผ่าน
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
      }

      // สร้าง JWT token
      const payload = {
        user: {
          id: user.id,
          hospital_id: user.hospital_id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              hospital_id: user.hospital_id,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              role: user.role,
            },
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/auth/me
// @desc    รับข้อมูลผู้ใช้ปัจจุบัน
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // ค้นหาข้อมูลผู้ใช้จาก ID (ไม่รวมรหัสผ่าน)
    const result = await req.db.query(
      "SELECT u.id, u.hospital_id, u.first_name, u.last_name, u.phone, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    // หากเป็นผู้ป่วย ให้ดึงข้อมูลเพิ่มเติม
    if (user.role === "patient") {
      const patientResult = await req.db.query(
        "SELECT * FROM patients WHERE user_id = $1",
        [user.id]
      );

      if (patientResult.rows.length > 0) {
        user.patient_data = patientResult.rows[0];
      }
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/auth/update-profile
// @desc    อัปเดตข้อมูลส่วนตัวของผู้ใช้ที่ล็อกอินอยู่
// @access  Private
router.post(
  "/update-profile",
  [
    auth,
    check("first_name", "กรุณาระบุชื่อ").optional().not().isEmpty(),
    check("last_name", "กรุณาระบุนามสกุล").optional().not().isEmpty(),
    check("phone", "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง")
      .optional()
      .matches(/^[0-9]{10}$/),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, phone } = req.body;

    try {
      // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
      const userExists = await req.db.query(
        "SELECT * FROM users WHERE id = $1",
        [req.user.id]
      );

      if (userExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (first_name) {
        updateFields.push(`first_name = $${paramIndex++}`);
        updateValues.push(first_name);
      }

      if (last_name) {
        updateFields.push(`last_name = $${paramIndex++}`);
        updateValues.push(last_name);
      }

      if (phone) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(phone);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของผู้ใช้ที่จะอัปเดต
      updateValues.push(req.user.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE users SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramIndex} RETURNING id, hospital_id, first_name, last_name, phone, role_id, is_active`,
        updateValues
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

module.exports = router;
