const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   POST api/appointments
// @desc    สร้างการนัดหมายใหม่ (สำหรับพยาบาลหรือแอดมิน)
// @access  Private/NurseOrAdmin
router.post(
  "/",
  [
    authNurseOrAdmin,
    check("patient_id", "กรุณาระบุรหัสผู้ป่วย").isNumeric(),
    check("appointment_date", "กรุณาระบุวันที่นัดหมาย").isDate(),
    check("appointment_time", "กรุณาระบุเวลานัดหมาย").matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    ),
    check("appointment_type", "กรุณาระบุประเภทการนัดหมาย").not().isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patient_id,
      appointment_date,
      appointment_time,
      appointment_type,
      location,
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

      // สร้างการนัดหมายใหม่
      const result = await req.db.query(
        "INSERT INTO appointments (patient_id, appointment_date, appointment_time, appointment_type, location, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          patient_id,
          appointment_date,
          appointment_time,
          appointment_type,
          location,
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

// @route   GET api/appointments
// @desc    ดึงข้อมูลการนัดหมายของผู้ป่วย
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    let patient_id;

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

      patient_id = patientResult.rows[0].id;
    }
    // กรณีพยาบาลหรือแอดมินดูข้อมูลของผู้ป่วยคนใดคนหนึ่ง
    else if ((role === "nurse" || role === "admin") && req.query.patient_id) {
      patient_id = req.query.patient_id;
    }
    // กรณีพยาบาลดูข้อมูลการนัดหมายทั้งหมดของตน
    else if (role === "nurse" || role === "admin") {
      // สำหรับพยาบาล ดึงการนัดหมายของผู้ป่วยที่พยาบาลรับผิดชอบ
      if (req.query.upcoming === "true") {
        // กรณีต้องการเฉพาะการนัดหมายที่กำลังจะมาถึง
        const appointmentsResult = await req.db.query(
          `SELECT a.*, u.first_name, u.last_name, u.hospital_id 
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users u ON p.user_id = u.id
           WHERE p.nurse_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.is_completed = false
           ORDER BY a.appointment_date, a.appointment_time`,
          [req.user.id]
        );
        return res.json(appointmentsResult.rows);
      } else if (req.query.date) {
        // กรณีต้องการการนัดหมายในวันที่ระบุ
        const appointmentsResult = await req.db.query(
          `SELECT a.*, u.first_name, u.last_name, u.hospital_id 
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users u ON p.user_id = u.id
           WHERE p.nurse_id = $1 AND a.appointment_date = $2
           ORDER BY a.appointment_time`,
          [req.user.id, req.query.date]
        );
        return res.json(appointmentsResult.rows);
      } else {
        // กรณีต้องการข้อมูลทั้งหมด
        const appointmentsResult = await req.db.query(
          `SELECT a.*, u.first_name, u.last_name, u.hospital_id 
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users u ON p.user_id = u.id
           WHERE p.nurse_id = $1
           ORDER BY a.appointment_date DESC, a.appointment_time`,
          [req.user.id]
        );
        return res.json(appointmentsResult.rows);
      }
    }
    // กรณีไม่ระบุ patient_id และไม่ใช่พยาบาล
    else {
      return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
    }

    // ตัวกรองสำหรับผู้ป่วย
    let filter = "";
    let params = [patient_id];
    let paramIndex = 2;

    if (req.query.upcoming === "true") {
      // กรณีต้องการเฉพาะการนัดหมายที่กำลังจะมาถึง
      filter = ` AND appointment_date >= CURRENT_DATE AND is_completed = false`;
    } else if (req.query.past === "true") {
      // กรณีต้องการเฉพาะการนัดหมายที่ผ่านมาแล้ว
      filter = ` AND (appointment_date < CURRENT_DATE OR is_completed = true)`;
    } else if (req.query.date) {
      // กรณีต้องการการนัดหมายในวันที่ระบุ
      filter = ` AND appointment_date = $${paramIndex++}`;
      params.push(req.query.date);
    }

    // กำหนด limit หากมีการระบุ
    let limitClause = "";
    if (req.query.limit) {
      limitClause = ` LIMIT $${paramIndex++}`;
      params.push(parseInt(req.query.limit));
    }

    // ดึงข้อมูลการนัดหมาย
    const appointmentsResult = await req.db.query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1${filter} 
       ORDER BY appointment_date${
         req.query.upcoming === "true" ? "" : " DESC"
       }, appointment_time${limitClause}`,
      params
    );

    res.json(appointmentsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/appointments/:id
// @desc    ดึงข้อมูลการนัดหมายตาม ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT a.*, p.user_id, u.first_name, u.last_name 
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการนัดหมาย" });
    }

    const appointment = result.rows[0];

    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient" && appointment.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    // พยาบาลสามารถดูได้เฉพาะข้อมูลของผู้ป่วยที่รับผิดชอบ
    if (role === "nurse") {
      const nursePatientResult = await req.db.query(
        "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
        [appointment.patient_id, req.user.id]
      );

      if (nursePatientResult.rows.length === 0) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
      }
    }

    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/appointments/:id
// @desc    แก้ไขข้อมูลการนัดหมาย
// @access  Private/NurseOrAdmin
router.put(
  "/:id",
  [
    authNurseOrAdmin,
    check("appointment_date", "กรุณาระบุวันที่นัดหมาย").optional().isDate(),
    check("appointment_time", "กรุณาระบุเวลานัดหมาย")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check("appointment_type", "กรุณาระบุประเภทการนัดหมาย")
      .optional()
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      appointment_date,
      appointment_time,
      appointment_type,
      location,
      notes,
      is_completed,
    } = req.body;

    try {
      // ตรวจสอบว่ามีการนัดหมายนี้อยู่หรือไม่
      const appointmentResult = await req.db.query(
        "SELECT * FROM appointments WHERE id = $1",
        [req.params.id]
      );

      if (appointmentResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลการนัดหมาย" });
      }

      // ตรวจสอบว่าพยาบาลมีสิทธิ์แก้ไขหรือไม่ (ต้องเป็นผู้ป่วยที่พยาบาลรับผิดชอบ)
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      if (role === "nurse") {
        const appointmentPatient = await req.db.query(
          "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
          [appointmentResult.rows[0].patient_id, req.user.id]
        );

        if (appointmentPatient.rows.length === 0) {
          return res
            .status(403)
            .json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลการนัดหมายนี้" });
        }
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (appointment_date) {
        updateFields.push(`appointment_date = ${paramIndex++}`);
        updateValues.push(appointment_date);
      }

      if (appointment_time) {
        updateFields.push(`appointment_time = ${paramIndex++}`);
        updateValues.push(appointment_time);
      }

      if (appointment_type) {
        updateFields.push(`appointment_type = ${paramIndex++}`);
        updateValues.push(appointment_type);
      }

      if (location !== undefined) {
        updateFields.push(`location = ${paramIndex++}`);
        updateValues.push(location);
      }

      if (notes !== undefined) {
        updateFields.push(`notes = ${paramIndex++}`);
        updateValues.push(notes);
      }

      if (is_completed !== undefined) {
        updateFields.push(`is_completed = ${paramIndex++}`);
        updateValues.push(is_completed);
      }

      updateFields.push(`updated_at = ${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของรายการที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE appointments SET ${updateFields.join(
          ", "
        )} WHERE id = ${paramIndex} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   DELETE api/appointments/:id
// @desc    ลบข้อมูลการนัดหมาย
// @access  Private/NurseOrAdmin
router.delete("/:id", authNurseOrAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่ามีการนัดหมายนี้อยู่หรือไม่
    const appointmentResult = await req.db.query(
      "SELECT * FROM appointments WHERE id = $1",
      [req.params.id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการนัดหมาย" });
    }

    // ตรวจสอบว่าพยาบาลมีสิทธิ์ลบหรือไม่ (ต้องเป็นผู้ป่วยที่พยาบาลรับผิดชอบ)
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    if (role === "nurse") {
      const appointmentPatient = await req.db.query(
        "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
        [appointmentResult.rows[0].patient_id, req.user.id]
      );

      if (appointmentPatient.rows.length === 0) {
        return res
          .status(403)
          .json({ message: "ไม่มีสิทธิ์ลบข้อมูลการนัดหมายนี้" });
      }
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM appointments WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ message: "ลบข้อมูลการนัดหมายเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/appointments/today
// @desc    ดึงข้อมูลการนัดหมายวันนี้ (สำหรับพยาบาล)
// @access  Private/NurseOrAdmin
router.get("/schedule/today", authNurseOrAdmin, async (req, res) => {
  try {
    // ดึงข้อมูลการนัดหมายของผู้ป่วยที่พยาบาลรับผิดชอบในวันนี้
    const appointmentsResult = await req.db.query(
      `SELECT a.*, u.first_name, u.last_name, u.hospital_id, u.phone
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE p.nurse_id = $1 AND a.appointment_date = CURRENT_DATE
       ORDER BY a.appointment_time`,
      [req.user.id]
    );

    res.json(appointmentsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/appointments/upcoming
// @desc    ดึงข้อมูลการนัดหมายที่กำลังจะมาถึง (สำหรับพยาบาล)
// @access  Private/NurseOrAdmin
router.get("/schedule/upcoming", authNurseOrAdmin, async (req, res) => {
  try {
    // กำหนดจำนวนวันที่ต้องการดูล่วงหน้า (ค่าเริ่มต้นคือ 7 วัน)
    const days = req.query.days ? parseInt(req.query.days) : 7;

    // คำนวณวันที่สิ้นสุด
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const formattedEndDate = endDate.toISOString().split("T")[0];

    // ดึงข้อมูลการนัดหมาย
    const appointmentsResult = await req.db.query(
      `SELECT a.*, u.first_name, u.last_name, u.hospital_id, u.phone
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE p.nurse_id = $1 
         AND a.appointment_date >= CURRENT_DATE 
         AND a.appointment_date <= $2
         AND a.is_completed = false
       ORDER BY a.appointment_date, a.appointment_time`,
      [req.user.id, formattedEndDate]
    );

    res.json(appointmentsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
