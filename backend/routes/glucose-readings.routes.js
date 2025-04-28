// glucose-readings.routes.js
const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   GET api/glucose-readings
// @desc    ดึงข้อมูลระดับน้ำตาลของผู้ป่วย
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    let patientId;

    // ตรวจสอบบทบาทผู้ใช้
    try {
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }

      const role = userResult.rows[0].role;

      // กรณีผู้ป่วยดูข้อมูลตัวเอง
      if (role === "patient") {
        try {
          const patientResult = await req.db.query(
            "SELECT id FROM patients WHERE user_id = $1",
            [req.user.id]
          );

          if (patientResult.rows.length === 0) {
            return res.json([]);
          }

          patientId = patientResult.rows[0].id;
        } catch (err) {
          console.error("Error finding patient ID:", err);
          return res
            .status(500)
            .json({ message: "เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ป่วย" });
        }
      }
      // กรณีพยาบาลหรือแอดมินดูข้อมูลของผู้ป่วยคนใดคนหนึ่ง
      else if ((role === "nurse" || role === "admin") && req.query.patient_id) {
        patientId = req.query.patient_id;
      }
      // กรณีไม่ระบุ patient_id และไม่ใช่ผู้ป่วย
      else {
        return res.json([]);
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      return res
        .status(500)
        .json({ message: "เกิดข้อผิดพลาดในการตรวจสอบบทบาทผู้ใช้" });
    }

    // กำหนด limit หากมีการระบุ
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const limitClause = limit ? `LIMIT ${limit}` : "";

    // ดึงข้อมูลระดับน้ำตาลของผู้ป่วย
    const result = await req.db.query(
      `SELECT * FROM glucose_readings 
       WHERE patient_id = $1 
       ORDER BY reading_date DESC, reading_time DESC ${limitClause}`,
      [patientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error querying glucose readings:", err);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลระดับน้ำตาล" });
  }
});

// @route   POST api/glucose-readings
// @desc    บันทึกข้อมูลระดับน้ำตาลใหม่
// @access  Private
router.post(
  "/",
  [
    auth,
    check("reading_date", "กรุณาระบุวันที่วัด").isDate(),
    check("reading_time", "กรุณาระบุเวลาวัด").matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    ),
    check("glucose_value", "กรุณาระบุระดับน้ำตาล").isNumeric(),
    check("reading_type", "กรุณาระบุช่วงเวลา").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reading_date, reading_time, glucose_value, reading_type, notes } =
      req.body;

    try {
      // กรณีผู้ป่วยบันทึกข้อมูลของตนเอง
      let patientId;

      // ตรวจสอบบทบาทผู้ใช้
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      // กรณีผู้ป่วยบันทึกข้อมูลตัวเอง
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
      // กรณีพยาบาลหรือแอดมินบันทึกข้อมูลให้ผู้ป่วย
      else if ((role === "nurse" || role === "admin") && req.body.patient_id) {
        patientId = req.body.patient_id;
      }
      // กรณีไม่ระบุ patient_id และไม่ใช่ผู้ป่วย
      else {
        return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
      }

      // บันทึกข้อมูลระดับน้ำตาล
      const result = await req.db.query(
        "INSERT INTO glucose_readings (patient_id, reading_date, reading_time, glucose_value, reading_type, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          patientId,
          reading_date,
          reading_time,
          glucose_value,
          reading_type,
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

// เพิ่ม endpoints อื่นๆ สำหรับแก้ไขและลบข้อมูลระดับน้ำตาล

module.exports = router;
