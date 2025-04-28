const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   GET api/medications
// @desc    ดึงข้อมูลการใช้ยาของผู้ป่วย
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    let patientId;

    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // กรณีผู้ป่วยดูข้อมูลตัวเอง
    if (role === "patient") {
      const patientResult = await req.db.query(
        "SELECT id FROM patients WHERE user_id = $1",
        [req.user.id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      patientId = patientResult.rows[0].id;
    }
    // กรณีพยาบาลหรือแอดมินดูข้อมูลของผู้ป่วยคนใดคนหนึ่ง
    else if ((role === "nurse" || role === "admin") && req.query.patient_id) {
      patientId = req.query.patient_id;
    }
    // กรณีไม่ระบุ patient_id และไม่ใช่ผู้ป่วย
    else {
      return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
    }

    // สร้าง query
    let query = "SELECT * FROM medications WHERE patient_id = $1";
    let queryParams = [patientId];
    let paramIndex = 2;

    // กรณีต้องการเฉพาะยาที่ยังใช้อยู่
    if (req.query.active === "true") {
      query += ` AND (end_date IS NULL OR end_date >= CURRENT_DATE)`;
    }

    // เรียงตามวันที่เริ่มใช้ล่าสุด
    query += " ORDER BY start_date DESC";

    // กำหนด limit หากมีการระบุ
    if (req.query.limit) {
      query += ` LIMIT $${paramIndex++}`;
      queryParams.push(parseInt(req.query.limit));
    }

    // ดึงข้อมูลยา
    const result = await req.db.query(query, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/medications
// @desc    บันทึกข้อมูลการใช้ยาใหม่ (สำหรับพยาบาลหรือแอดมิน)
// @access  Private/NurseOrAdmin
router.post(
  "/",
  [
    authNurseOrAdmin,
    check("patient_id", "กรุณาระบุรหัสผู้ป่วย").isNumeric(),
    check("medication_name", "กรุณาระบุชื่อยา").not().isEmpty(),
    check("dosage", "กรุณาระบุขนาดยา").not().isEmpty(),
    check("frequency", "กรุณาระบุความถี่ในการใช้ยา").not().isEmpty(),
    check("start_date", "กรุณาระบุวันที่เริ่มใช้ยา").isDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patient_id,
      medication_name,
      dosage,
      frequency,
      start_date,
      end_date,
      notes,
    } = req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่จริงหรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [patient_id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // บันทึกข้อมูลยา
      const result = await req.db.query(
        "INSERT INTO medications (patient_id, medication_name, dosage, frequency, start_date, end_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          patient_id,
          medication_name,
          dosage,
          frequency,
          start_date,
          end_date,
          notes,
        ]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// เพิ่ม endpoints อื่นๆ สำหรับแก้ไขและลบข้อมูลยา

module.exports = router;
