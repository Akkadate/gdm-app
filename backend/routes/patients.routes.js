const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   GET api/patients/me
// @desc    ดึงข้อมูลผู้ป่วยของตัวเอง
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    const role = userResult.rows[0].role;

    // ถ้าไม่ใช่ผู้ป่วย ไม่อนุญาตให้เข้าถึง
    if (role !== "patient") {
      return res
        .status(403)
        .json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วย" });
    }

    // ดึงข้อมูล patient ID จาก user ID
    const patientResult = await req.db.query(
      "SELECT * FROM patients WHERE user_id = $1",
      [req.user.id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    const patientId = patientResult.rows[0].id;

    // ดึงข้อมูลผู้ป่วย
    const result = await req.db.query(
      `SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone,
              n.first_name as nurse_first_name, n.last_name as nurse_last_name
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users n ON p.nurse_id = n.id
       WHERE p.id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    // รวมข้อมูลผู้ป่วย
    const patient = result.rows[0];

    // ดึงข้อมูลน้ำหนักล่าสุด
    const weightResult = await req.db.query(
      "SELECT * FROM weight_records WHERE patient_id = $1 ORDER BY record_date DESC LIMIT 1",
      [patientId]
    );
    if (weightResult.rows.length > 0) {
      patient.latest_weight = weightResult.rows[0];
    }

    // ดึงข้อมูลการนัดหมายที่จะถึง
    const appointmentResult = await req.db.query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1 AND appointment_date >= CURRENT_DATE AND is_completed = false
       ORDER BY appointment_date, appointment_time LIMIT 3`,
      [patientId]
    );
    patient.upcoming_appointments = appointmentResult.rows;

    // ดึงข้อมูลเป้าหมายระดับน้ำตาลปัจจุบัน
    const targetResult = await req.db.query(
      `SELECT * FROM glucose_targets 
       WHERE patient_id = $1 
       ORDER BY effective_date DESC`,
      [patientId]
    );
    patient.glucose_targets = targetResult.rows;

    // ดึงข้อมูลยาปัจจุบัน
    const medicationResult = await req.db.query(
      `SELECT * FROM medications 
       WHERE patient_id = $1 AND is_active = true
       ORDER BY start_date DESC`,
      [patientId]
    );
    patient.medications = medicationResult.rows;

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/patients
// @desc    ดึงข้อมูลผู้ป่วยทั้งหมด (สำหรับพยาบาล/แอดมิน)
// @access  Private/NurseOrAdmin
router.get("/", authNurseOrAdmin, async (req, res) => {
  try {
    // ตรวจสอบบทบาท
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    let query;
    let params = [];

    // สำหรับพยาบาล ดึงเฉพาะผู้ป่วยที่รับผิดชอบ
    if (role === "nurse") {
      query = `
        SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone,
               (SELECT COUNT(*) FROM glucose_readings gr 
                WHERE gr.patient_id = p.id 
                AND gr.reading_date = CURRENT_DATE) as readings_today,
               (SELECT COUNT(*) FROM appointments a 
                WHERE a.patient_id = p.id 
                AND a.appointment_date >= CURRENT_DATE
                AND a.is_completed = false) as upcoming_appointments
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE p.nurse_id = $1
        ORDER BY u.last_name, u.first_name
      `;
      params = [req.user.id];
    }
    // สำหรับแอดมิน ดึงผู้ป่วยทั้งหมด
    else {
      query = `
        SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone,
               n.first_name as nurse_first_name, n.last_name as nurse_last_name,
               (SELECT COUNT(*) FROM glucose_readings gr 
                WHERE gr.patient_id = p.id 
                AND gr.reading_date = CURRENT_DATE) as readings_today,
               (SELECT COUNT(*) FROM appointments a 
                WHERE a.patient_id = p.id 
                AND a.appointment_date >= CURRENT_DATE
                AND a.is_completed = false) as upcoming_appointments
        FROM patients p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN users n ON p.nurse_id = n.id
        ORDER BY u.last_name, u.first_name
      `;
    }

    const result = await req.db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/patients/dashboard
// @desc    ดึงข้อมูลสรุปสำหรับแดชบอร์ดของพยาบาล
// @access  Private/NurseOrAdmin
router.get("/dashboard", authNurseOrAdmin, async (req, res) => {
  try {
    // ค้นหาผู้ป่วยที่มีค่าน้ำตาลผิดปกติใน 24 ชั่วโมงล่าสุด
    const abnormalQuery = `
      WITH recent_readings AS (
        SELECT gr.patient_id, gr.glucose_value, gr.reading_type,
               p.user_id, gr.created_at,
               CASE 
                 WHEN gr.reading_type LIKE '%หลัง%' THEN 
                   (SELECT max_value FROM glucose_targets 
                    WHERE patient_id = gr.patient_id AND target_type = 'หลังอาหาร' 
                    ORDER BY effective_date DESC LIMIT 1) 
                 ELSE 
                   (SELECT max_value FROM glucose_targets 
                    WHERE patient_id = gr.patient_id AND target_type = 'ก่อนอาหาร' 
                    ORDER BY effective_date DESC LIMIT 1) 
               END as target_max,
               CASE 
                 WHEN gr.reading_type LIKE '%หลัง%' THEN 
                   (SELECT min_value FROM glucose_targets 
                    WHERE patient_id = gr.patient_id AND target_type = 'หลังอาหาร' 
                    ORDER BY effective_date DESC LIMIT 1) 
                 ELSE 
                   (SELECT min_value FROM glucose_targets 
                    WHERE patient_id = gr.patient_id AND target_type = 'ก่อนอาหาร' 
                    ORDER BY effective_date DESC LIMIT 1) 
               END as target_min
        FROM glucose_readings gr
        JOIN patients p ON gr.patient_id = p.id
        WHERE gr.created_at >= NOW() - INTERVAL '24 HOURS'
      )
      SELECT u.hospital_id, u.first_name, u.last_name, 
             COUNT(rr.*) as abnormal_count,
             MAX(rr.created_at) as latest_reading
      FROM recent_readings rr
      JOIN users u ON rr.user_id = u.id
      JOIN patients p ON p.user_id = u.id
      WHERE (rr.glucose_value > COALESCE(rr.target_max, 120) OR 
             rr.glucose_value < COALESCE(rr.target_min, 70))
      AND p.nurse_id = $1
      GROUP BY u.hospital_id, u.first_name, u.last_name
      ORDER BY latest_reading DESC
    `;

    const abnormalResult = await req.db.query(abnormalQuery, [req.user.id]);

    // จำนวนผู้ป่วยทั้งหมดที่ดูแล
    const totalPatientsResult = await req.db.query(
      "SELECT COUNT(*) as total FROM patients WHERE nurse_id = $1",
      [req.user.id]
    );

    // จำนวนการนัดหมายวันนี้
    const todayAppointmentsResult = await req.db.query(
      `SELECT COUNT(*) as count 
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE p.nurse_id = $1 AND a.appointment_date = CURRENT_DATE AND a.is_completed = false`,
      [req.user.id]
    );

    // ค่าเฉลี่ยน้ำตาลของผู้ป่วยทั้งหมดในสัปดาห์นี้
    const avgGlucoseResult = await req.db.query(
      `SELECT ROUND(AVG(gr.glucose_value)::numeric, 2) as average_glucose
       FROM glucose_readings gr
       JOIN patients p ON gr.patient_id = p.id
       WHERE p.nurse_id = $1 AND gr.reading_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );

    // ส่งข้อมูลสรุป
    res.json({
      abnormalPatients: abnormalResult.rows,
      totalPatients: totalPatientsResult.rows[0].total,
      todayAppointments: todayAppointmentsResult.rows[0].count,
      weeklyAverageGlucose: avgGlucoseResult.rows[0].average_glucose || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/patients/:id
// @desc    ดึงข้อมูลผู้ป่วยคนใดคนหนึ่ง
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // กรณีผู้ป่วยต้องดูได้เฉพาะข้อมูลตัวเอง
    if (role === "patient") {
      const patientResult = await req.db.query(
        "SELECT id FROM patients WHERE user_id = $1",
        [req.user.id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      if (patientResult.rows[0].id !== parseInt(req.params.id)) {
        return res
          .status(403)
          .json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยรายนี้" });
      }
    }

    // ดึงข้อมูลผู้ป่วย
    const result = await req.db.query(
      `SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone,
              n.first_name as nurse_first_name, n.last_name as nurse_last_name
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users n ON p.nurse_id = n.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    // รวมข้อมูลผู้ป่วย
    const patient = result.rows[0];

    // ดึงข้อมูลน้ำหนักล่าสุด
    const weightResult = await req.db.query(
      "SELECT * FROM weight_records WHERE patient_id = $1 ORDER BY record_date DESC LIMIT 1",
      [req.params.id]
    );
    if (weightResult.rows.length > 0) {
      patient.latest_weight = weightResult.rows[0];
    }

    // ดึงข้อมูลการนัดหมายที่จะถึง
    const appointmentResult = await req.db.query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1 AND appointment_date >= CURRENT_DATE AND is_completed = false
       ORDER BY appointment_date, appointment_time LIMIT 3`,
      [req.params.id]
    );
    patient.upcoming_appointments = appointmentResult.rows;

    // ดึงข้อมูลเป้าหมายระดับน้ำตาลปัจจุบัน
    const targetResult = await req.db.query(
      `SELECT * FROM glucose_targets 
       WHERE patient_id = $1 
       ORDER BY effective_date DESC`,
      [req.params.id]
    );
    patient.glucose_targets = targetResult.rows;

    // ดึงข้อมูลยาปัจจุบัน
    const medicationResult = await req.db.query(
      `SELECT * FROM medications 
       WHERE patient_id = $1 AND is_active = true
       ORDER BY start_date DESC`,
      [req.params.id]
    );
    patient.medications = medicationResult.rows;

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/patients/:id
// @desc    อัปเดตข้อมูลผู้ป่วย
// @access  Private/NurseOrAdmin
router.put(
  "/:id",
  [
    authNurseOrAdmin,
    check("date_of_birth", "รูปแบบวันเกิดไม่ถูกต้อง").optional().isDate(),
    check("expected_delivery_date", "รูปแบบวันกำหนดคลอดไม่ถูกต้อง")
      .optional()
      .isDate(),
    check("pre_pregnancy_weight", "น้ำหนักก่อนตั้งครรภ์ต้องเป็นตัวเลข")
      .optional()
      .isNumeric(),
    check("height", "ส่วนสูงต้องเป็นตัวเลข").optional().isNumeric(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      date_of_birth,
      gestational_age_at_diagnosis,
      expected_delivery_date,
      pre_pregnancy_weight,
      height,
      blood_type,
      previous_gdm,
      family_diabetes_history,
      nurse_id,
    } = req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่หรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [req.params.id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (date_of_birth) {
        updateFields.push(`date_of_birth = ${paramIndex++}`);
        updateValues.push(date_of_birth);
      }

      if (gestational_age_at_diagnosis !== undefined) {
        updateFields.push(`gestational_age_at_diagnosis = ${paramIndex++}`);
        updateValues.push(gestational_age_at_diagnosis);
      }

      if (expected_delivery_date) {
        updateFields.push(`expected_delivery_date = ${paramIndex++}`);
        updateValues.push(expected_delivery_date);
      }

      if (pre_pregnancy_weight) {
        updateFields.push(`pre_pregnancy_weight = ${paramIndex++}`);
        updateValues.push(pre_pregnancy_weight);
      }

      if (height) {
        updateFields.push(`height = ${paramIndex++}`);
        updateValues.push(height);
      }

      if (blood_type) {
        updateFields.push(`blood_type = ${paramIndex++}`);
        updateValues.push(blood_type);
      }

      if (previous_gdm !== undefined) {
        updateFields.push(`previous_gdm = ${paramIndex++}`);
        updateValues.push(previous_gdm);
      }

      if (family_diabetes_history !== undefined) {
        updateFields.push(`family_diabetes_history = ${paramIndex++}`);
        updateValues.push(family_diabetes_history);
      }

      if (nurse_id) {
        updateFields.push(`nurse_id = ${paramIndex++}`);
        updateValues.push(nurse_id);
      }

      updateFields.push(`updated_at = ${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของผู้ป่วยที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE patients SET ${updateFields.join(
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

// @route   POST api/patients/:id/targets
// @desc    กำหนดเป้าหมายระดับน้ำตาลสำหรับผู้ป่วย
// @access  Private/NurseOrAdmin
router.post(
  "/:id/targets",
  [
    authNurseOrAdmin,
    check("target_type", "กรุณาระบุประเภทเป้าหมาย").not().isEmpty(),
    check("min_value", "กรุณาระบุค่าต่ำสุดที่เป็นตัวเลข").isNumeric(),
    check("max_value", "กรุณาระบุค่าสูงสุดที่เป็นตัวเลข").isNumeric(),
    check("effective_date", "กรุณาระบุวันที่เริ่มใช้งาน").isDate(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { target_type, min_value, max_value, effective_date, notes } =
      req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่หรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [req.params.id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // บันทึกเป้าหมายใหม่
      const result = await req.db.query(
        "INSERT INTO glucose_targets (patient_id, target_type, min_value, max_value, set_by, effective_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          req.params.id,
          target_type,
          min_value,
          max_value,
          req.user.id,
          effective_date,
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

// @route   POST api/patients/:id/treatments
// @desc    บันทึกการรักษาสำหรับผู้ป่วย
// @access  Private/NurseOrAdmin
router.post(
  "/:id/treatments",
  [
    authNurseOrAdmin,
    check("treatment_type", "กรุณาระบุประเภทการรักษา").not().isEmpty(),
    check("details", "กรุณาระบุรายละเอียดการรักษา").not().isEmpty(),
    check("treatment_date", "กรุณาระบุวันที่รักษา").isDate(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { treatment_type, details, treatment_date } = req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่หรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [req.params.id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // บันทึกการรักษา
      const result = await req.db.query(
        "INSERT INTO treatments (patient_id, treatment_type, details, treatment_date, nurse_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [req.params.id, treatment_type, details, treatment_date, req.user.id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   POST api/patients/update-self
// @desc    ผู้ป่วยอัปเดตข้อมูลของตนเอง
// @access  Private
router.post(
  "/update-self",
  [
    auth,
    check("expected_delivery_date", "รูปแบบวันกำหนดคลอดไม่ถูกต้อง")
      .optional()
      .isDate(),
    check("pre_pregnancy_weight", "น้ำหนักก่อนตั้งครรภ์ต้องเป็นตัวเลข")
      .optional()
      .isNumeric(),
    check("height", "ส่วนสูงต้องเป็นตัวเลข").optional().isNumeric(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      expected_delivery_date,
      gestational_age_at_diagnosis,
      pre_pregnancy_weight,
      height,
      blood_type,
      previous_gdm,
      family_diabetes_history,
    } = req.body;

    try {
      // ตรวจสอบบทบาทของผู้ใช้
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );

      if (
        userResult.rows.length === 0 ||
        userResult.rows[0].role !== "patient"
      ) {
        return res
          .status(403)
          .json({ message: "เฉพาะผู้ป่วยเท่านั้นที่สามารถใช้ API นี้ได้" });
      }

      // ค้นหา patient_id ของผู้ใช้
      const patientResult = await req.db.query(
        "SELECT id FROM patients WHERE user_id = $1",
        [req.user.id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      const patientId = patientResult.rows[0].id;

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (expected_delivery_date) {
        updateFields.push(`expected_delivery_date = $${paramIndex++}`);
        updateValues.push(expected_delivery_date);
      }

      if (gestational_age_at_diagnosis !== undefined) {
        updateFields.push(`gestational_age_at_diagnosis = $${paramIndex++}`);
        updateValues.push(gestational_age_at_diagnosis);
      }

      if (pre_pregnancy_weight) {
        updateFields.push(`pre_pregnancy_weight = $${paramIndex++}`);
        updateValues.push(pre_pregnancy_weight);
      }

      if (height) {
        updateFields.push(`height = $${paramIndex++}`);
        updateValues.push(height);
      }

      if (blood_type) {
        updateFields.push(`blood_type = $${paramIndex++}`);
        updateValues.push(blood_type);
      }

      if (previous_gdm !== undefined) {
        updateFields.push(`previous_gdm = $${paramIndex++}`);
        updateValues.push(previous_gdm);
      }

      if (family_diabetes_history !== undefined) {
        updateFields.push(`family_diabetes_history = $${paramIndex++}`);
        updateValues.push(family_diabetes_history);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของผู้ป่วยที่จะอัปเดต
      updateValues.push(patientId);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE patients SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/patients/by-user/:userId
// @desc    ดึงข้อมูลผู้ป่วยตาม user_id
// @access  Private
router.get("/by-user/:userId", auth, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ (ผู้ใช้ดูได้เฉพาะข้อมูลของตนเอง)
    if (
      req.user.id !== parseInt(req.params.userId) &&
      req.user.role !== "admin" &&
      req.user.role !== "nurse"
    ) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูล" });
    }

    // ดึงข้อมูลผู้ป่วย
    const result = await req.db.query(
      `SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone 
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/patients/update-self
// @desc    ผู้ป่วยอัปเดตข้อมูลของตนเอง
// @access  Private
router.post(
  "/update-self",
  [
    auth,
    check("date_of_birth", "รูปแบบวันเกิดไม่ถูกต้อง").optional().isDate(),
    check("expected_delivery_date", "รูปแบบวันกำหนดคลอดไม่ถูกต้อง")
      .optional()
      .isDate(),
    check("pre_pregnancy_weight", "น้ำหนักก่อนตั้งครรภ์ต้องเป็นตัวเลข")
      .optional()
      .isNumeric(),
    check("height", "ส่วนสูงต้องเป็นตัวเลข").optional().isNumeric(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      date_of_birth,
      gestational_age_at_diagnosis,
      expected_delivery_date,
      pre_pregnancy_weight,
      height,
      blood_type,
      previous_gdm,
      family_diabetes_history,
    } = req.body;

    try {
      // ค้นหา patient_id ของผู้ใช้
      const patientResult = await req.db.query(
        "SELECT id FROM patients WHERE user_id = $1",
        [req.user.id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      const patientId = patientResult.rows[0].id;

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (date_of_birth) {
        updateFields.push(`date_of_birth = $${paramIndex++}`);
        updateValues.push(date_of_birth);
      }

      if (gestational_age_at_diagnosis !== undefined) {
        updateFields.push(`gestational_age_at_diagnosis = $${paramIndex++}`);
        updateValues.push(gestational_age_at_diagnosis);
      }

      if (expected_delivery_date) {
        updateFields.push(`expected_delivery_date = $${paramIndex++}`);
        updateValues.push(expected_delivery_date);
      }

      if (pre_pregnancy_weight) {
        updateFields.push(`pre_pregnancy_weight = $${paramIndex++}`);
        updateValues.push(pre_pregnancy_weight);
      }

      if (height) {
        updateFields.push(`height = $${paramIndex++}`);
        updateValues.push(height);
      }

      if (blood_type) {
        updateFields.push(`blood_type = $${paramIndex++}`);
        updateValues.push(blood_type);
      }

      if (previous_gdm !== undefined) {
        updateFields.push(`previous_gdm = $${paramIndex++}`);
        updateValues.push(previous_gdm);
      }

      if (family_diabetes_history !== undefined) {
        updateFields.push(`family_diabetes_history = $${paramIndex++}`);
        updateValues.push(family_diabetes_history);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของผู้ป่วยที่จะอัปเดต
      updateValues.push(patientId);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE patients SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// เพิ่ม endpoint ใหม่ใน routes/patients.routes.js

// @route   POST api/patients/assign-nurse
// @desc    กำหนดพยาบาลให้ผู้ป่วย (สำหรับแอดมิน)
// @access  Private/Admin
router.post(
  "/assign-nurse",
  [
    authAdmin,
    check("patient_id", "กรุณาระบุรหัสผู้ป่วย").isNumeric(),
    check("nurse_id", "กรุณาระบุรหัสพยาบาล").isNumeric()
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patient_id, nurse_id } = req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่จริงหรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [patient_id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // ตรวจสอบว่าพยาบาลมีอยู่จริงหรือไม่
      const nurseExists = await req.db.query(
        "SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [nurse_id]
      );

      if (nurseExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลพยาบาล" });
      }

      // ตรวจสอบว่าผู้ใช้ที่ระบุเป็นพยาบาลจริงหรือไม่
      if (nurseExists.rows[0].role !== "nurse") {
        return res.status(400).json({ message: "ผู้ใช้นี้ไม่ใช่พยาบาล" });
      }

      // อัปเดตข้อมูลพยาบาลที่รับผิดชอบผู้ป่วย
      const result = await req.db.query(
        "UPDATE patients SET nurse_id = $1, updated_at = $2 WHERE id = $3 RETURNING *",
        [nurse_id, new Date(), patient_id]
      );

      // ดึงข้อมูลเพิ่มเติมของผู้ป่วยและพยาบาล
      const patientInfo = await req.db.query(
        `SELECT p.id as patient_id, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
                nu.id as nurse_id, nu.first_name as nurse_first_name, nu.last_name as nurse_last_name
         FROM patients p
         JOIN users pu ON p.user_id = pu.id
         JOIN users nu ON p.nurse_id = nu.id
         WHERE p.id = $1`,
        [patient_id]
      );

      res.json({
        success: true,
        message: "กำหนดพยาบาลให้ผู้ป่วยเรียบร้อยแล้ว",
        data: patientInfo.rows[0]
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/patients/unassigned
// @desc    ดึงรายชื่อผู้ป่วยที่ยังไม่มีพยาบาล
// @access  Private/Admin
router.get("/unassigned", authAdmin, async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT p.id, u.hospital_id, u.first_name, u.last_name, u.phone,
              p.date_of_birth, p.expected_delivery_date
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.nurse_id IS NULL
       ORDER BY u.first_name, u.last_name`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/patients/by-nurse/:nurse_id
// @desc    ดึงรายชื่อผู้ป่วยที่ดูแลโดยพยาบาลคนใดคนหนึ่ง
// @access  Private/Admin
router.get("/by-nurse/:nurse_id", authAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่าพยาบาลมีอยู่จริงหรือไม่
    const nurseExists = await req.db.query(
      "SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND r.name = 'nurse'",
      [req.params.nurse_id]
    );

    if (nurseExists.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพยาบาล" });
    }

    const result = await req.db.query(
      `SELECT p.id, u.hospital_id, u.first_name, u.last_name, u.phone,
              p.date_of_birth, p.expected_delivery_date
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.nurse_id = $1
       ORDER BY u.first_name, u.last_name`,
      [req.params.nurse_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/patients/:id/remove-nurse
// @desc    ยกเลิกการกำหนดพยาบาลให้ผู้ป่วย
// @access  Private/Admin
router.put("/:id/remove-nurse", authAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ป่วยมีอยู่จริงหรือไม่
    const patientExists = await req.db.query(
      "SELECT * FROM patients WHERE id = $1",
      [req.params.id]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    // อัปเดตข้อมูลพยาบาลที่รับผิดชอบผู้ป่วยเป็น null
    const result = await req.db.query(
      "UPDATE patients SET nurse_id = NULL, updated_at = $1 WHERE id = $2 RETURNING *",
      [new Date(), req.params.id]
    );

    res.json({
      success: true,
      message: "ยกเลิกการกำหนดพยาบาลให้ผู้ป่วยเรียบร้อยแล้ว",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/patients/batch-assign
// @desc    กำหนดพยาบาลให้ผู้ป่วยหลายคนพร้อมกัน
// @access  Private/Admin
router.post(
  "/batch-assign",
  [
    authAdmin,
    check("nurse_id", "กรุณาระบุรหัสพยาบาล").isNumeric(),
    check("patient_ids", "กรุณาระบุรายการรหัสผู้ป่วย").isArray().notEmpty()
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nurse_id, patient_ids } = req.body;

    try {
      // ตรวจสอบว่าพยาบาลมีอยู่จริงหรือไม่
      const nurseExists = await req.db.query(
        "SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [nurse_id]
      );

      if (nurseExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลพยาบาล" });
      }

      // ตรวจสอบว่าผู้ใช้ที่ระบุเป็นพยาบาลจริงหรือไม่
      if (nurseExists.rows[0].role !== "nurse") {
        return res.status(400).json({ message: "ผู้ใช้นี้ไม่ใช่พยาบาล" });
      }

      // อัปเดตข้อมูลพยาบาลที่รับผิดชอบผู้ป่วยทั้งหมด
      const result = await req.db.query(
        `UPDATE patients 
         SET nurse_id = $1, updated_at = $2 
         WHERE id = ANY($3::int[]) 
         RETURNING id`,
        [nurse_id, new Date(), patient_ids]
      );

      res.json({
        success: true,
        message: `กำหนดพยาบาลให้ผู้ป่วยจำนวน ${result.rows.length} คนเรียบร้อยแล้ว`,
        updated_count: result.rows.length,
        updated_ids: result.rows.map(row => row.id)
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);
module.exports = router;
