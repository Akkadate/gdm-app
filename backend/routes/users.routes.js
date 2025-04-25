const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { auth, authAdmin } = require("../middlewares/auth");

// @route   GET api/users
// @desc    ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะแอดมิน)
// @access  Private/Admin
router.get("/", authAdmin, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT u.id, u.hospital_id, u.first_name, u.last_name, u.phone, r.name as role, u.is_active, u.created_at FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/users/:id
// @desc    ดึงข้อมูลผู้ใช้ตาม ID
// @access  Private/Admin
router.get("/:id", authAdmin, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT u.id, u.hospital_id, u.first_name, u.last_name, u.phone, r.id as role_id, r.name as role, u.is_active, u.created_at FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/users
// @desc    สร้างผู้ใช้ใหม่ (เฉพาะแอดมิน)
// @access  Private/Admin
router.post(
  "/",
  [
    authAdmin,
    check("hospital_id", "กรุณาระบุเลขประจำตัว").not().isEmpty(),
    check("first_name", "กรุณาระบุชื่อ").not().isEmpty(),
    check("last_name", "กรุณาระบุนามสกุล").not().isEmpty(),
    check("phone", "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง").matches(/^[0-9]{10}$/),
    check("role_id", "กรุณาระบุบทบาท").isNumeric(),
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
      role_id,
      password,
      is_active,
    } = req.body;

    try {
      // ตรวจสอบว่า hospital_id ซ้ำหรือไม่
      const userExists = await req.db.query(
        "SELECT * FROM users WHERE hospital_id = $1",
        [hospital_id]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: "เลขประจำตัวนี้มีในระบบแล้ว" });
      }

      // เข้ารหัสรหัสผ่าน
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // สร้างผู้ใช้ใหม่
      const newUser = await req.db.query(
        "INSERT INTO users (hospital_id, first_name, last_name, phone, password, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, hospital_id, first_name, last_name, phone, role_id, is_active",
        [
          hospital_id,
          first_name,
          last_name,
          phone,
          hashedPassword,
          role_id,
          is_active || true,
        ]
      );

      res.json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   PUT api/users/:id
// @desc    อัปเดตข้อมูลผู้ใช้
// @access  Private/Admin
router.put(
  "/:id",
  [
    authAdmin,
    check("first_name", "กรุณาระบุชื่อ").optional().not().isEmpty(),
    check("last_name", "กรุณาระบุนามสกุล").optional().not().isEmpty(),
    check("phone", "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง")
      .optional()
      .matches(/^[0-9]{10}$/),
    check("role_id", "กรุณาระบุบทบาท").optional().isNumeric(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, phone, role_id, is_active, password } =
      req.body;

    try {
      // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
      const userExists = await req.db.query(
        "SELECT * FROM users WHERE id = $1",
        [req.params.id]
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

      if (role_id) {
        updateFields.push(`role_id = $${paramIndex++}`);
        updateValues.push(role_id);
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.push(`password = $${paramIndex++}`);
        updateValues.push(hashedPassword);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของผู้ใช้ที่จะอัปเดต
      updateValues.push(req.params.id);

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

// @route   DELETE api/users/:id
// @desc    ลบผู้ใช้
// @access  Private/Admin
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const userExists = await req.db.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);

    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    // ลบผู้ใช้
    await req.db.query("DELETE FROM users WHERE id = $1", [req.params.id]);

    res.json({ message: "ลบผู้ใช้เรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/users/nurses
// @desc    ดึงรายชื่อพยาบาลทั้งหมด
// @access  Private/Admin
router.get("/roles/nurses", authAdmin, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT u.id, u.hospital_id, u.first_name, u.last_name, u.phone FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1 AND u.is_active = true ORDER BY u.first_name, u.last_name",
      ["nurse"]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/users/change-password
// @desc    เปลี่ยนรหัสผ่าน
// @access  Private
router.post(
  "/change-password",
  [
    auth,
    check("current_password", "กรุณาระบุรหัสผ่านปัจจุบัน").exists(),
    check(
      "new_password",
      "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    try {
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      const userResult = await req.db.query(
        "SELECT * FROM users WHERE id = $1",
        [req.user.id]
      );

      const user = userResult.rows[0];

      if (!user) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      // ตรวจสอบรหัสผ่านปัจจุบัน
      const isMatch = await bcrypt.compare(current_password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }

      // เข้ารหัสรหัสผ่านใหม่
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      // อัปเดตรหัสผ่าน
      await req.db.query(
        "UPDATE users SET password = $1, updated_at = $2 WHERE id = $3",
        [hashedPassword, new Date(), req.user.id]
      );

      res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

module.exports = router;
