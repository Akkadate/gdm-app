const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   POST api/treatments
// @desc    บันทึกข้อมูลการรักษา (สำหรับพยาบาลหรือแอดมิน)
// @access  Private/NurseOrAdmin
router.post(
  "/",
  [
    authNurseOrAdmin,
    check("patient_id", "กรุณาระบุรหัสผู้ป่วย").isNumeric(),
    check("treatment_date", "กรุณาระบุวันที่รักษา").isDate(),
    check("treatment_type", "กรุณาระบุประเภทการรักษา").not().isEmpty(),
    check("details", "กรุณาระบุรายละเอียดการรักษา").not().isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patient_id, treatment_date, treatment_type, details } = req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่จริงหรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [patient_id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // ตรวจสอบว่าพยาบาลรับผิดชอบผู้ป่วยนี้หรือไม่ (ยกเว้นแอดมิน)
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      if (role === "nurse") {
        const nursePatient = await req.db.query(
          "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
          [patient_id, req.user.id]
        );

        if (nursePatient.rows.length === 0) {
          return res
            .status(403)
            .json({
              message: "ไม่มีสิทธิ์บันทึกข้อมูลการรักษาของผู้ป่วยรายนี้",
            });
        }
      }

      // บันทึกข้อมูลการรักษา
      const result = await req.db.query(
        "INSERT INTO treatments (patient_id, treatment_date, treatment_type, details, nurse_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [patient_id, treatment_date, treatment_type, details, req.user.id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/treatments
// @desc    ดึงข้อมูลการรักษาของผู้ป่วย
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

      // ตรวจสอบว่าพยาบาลรับผิดชอบผู้ป่วยนี้หรือไม่ (ยกเว้นแอดมิน)
      if (role === "nurse") {
        const nursePatient = await req.db.query(
          "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
          [patient_id, req.user.id]
        );

        if (nursePatient.rows.length === 0) {
          return res
            .status(403)
            .json({ message: "ไม่มีสิทธิ์ดูข้อมูลการรักษาของผู้ป่วยรายนี้" });
        }
      }
    }
    // กรณีไม่ระบุ patient_id
    else {
      return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
    }

    // ตัวกรองตามช่วงวันที่
    let dateFilter = "";
    let params = [patient_id];
    let paramIndex = 2;

    if (req.query.start_date && req.query.end_date) {
      dateFilter = ` AND treatment_date BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(req.query.start_date, req.query.end_date);
      paramIndex += 2;
    } else if (req.query.days) {
      // ดึงข้อมูลย้อนหลัง X วัน
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(req.query.days));
      dateFilter = ` AND treatment_date >= $${paramIndex}`;
      params.push(daysAgo.toISOString().split("T")[0]);
      paramIndex++;
    }

    // ตัวกรองตามประเภทการรักษา
    let typeFilter = "";
    if (req.query.type) {
      typeFilter = ` AND treatment_type = $${paramIndex}`;
      params.push(req.query.type);
      paramIndex++;
    }

    // ดึงข้อมูลการรักษาพร้อมข้อมูลพยาบาล
    const result = await req.db.query(
      `SELECT t.*, u.first_name as nurse_first_name, u.last_name as nurse_last_name 
       FROM treatments t
       JOIN users u ON t.nurse_id = u.id
       WHERE t.patient_id = $1${dateFilter}${typeFilter}
       ORDER BY t.treatment_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/treatments/:id
// @desc    ดึงข้อมูลการรักษาตาม ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // ดึงข้อมูลการรักษาพร้อมข้อมูลพยาบาล
    const result = await req.db.query(
      `SELECT t.*, u.first_name as nurse_first_name, u.last_name as nurse_last_name, p.user_id
       FROM treatments t
       JOIN users u ON t.nurse_id = u.id
       JOIN patients p ON t.patient_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการรักษา" });
    }

    const treatment = result.rows[0];

    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient" && treatment.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    // พยาบาลสามารถดูได้เฉพาะข้อมูลของผู้ป่วยที่รับผิดชอบ
    if (role === "nurse") {
      const nursePatientResult = await req.db.query(
        "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
        [treatment.patient_id, req.user.id]
      );

      if (nursePatientResult.rows.length === 0) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
      }
    }

    res.json(treatment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/treatments/:id
// @desc    แก้ไขข้อมูลการรักษา
// @access  Private/NurseOrAdmin
router.put(
  "/:id",
  [
    authNurseOrAdmin,
    check("treatment_date", "กรุณาระบุวันที่รักษา").optional().isDate(),
    check("treatment_type", "กรุณาระบุประเภทการรักษา")
      .optional()
      .not()
      .isEmpty(),
    check("details", "กรุณาระบุรายละเอียดการรักษา").optional().not().isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { treatment_date, treatment_type, details } = req.body;

    try {
      // ตรวจสอบว่ามีการรักษานี้อยู่หรือไม่
      const treatmentResult = await req.db.query(
        "SELECT * FROM treatments WHERE id = $1",
        [req.params.id]
      );

      if (treatmentResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลการรักษา" });
      }

      const treatment = treatmentResult.rows[0];

      // ตรวจสอบว่าพยาบาลมีสิทธิ์แก้ไขหรือไม่
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      // พยาบาลสามารถแก้ไขเฉพาะข้อมูลที่ตนเองบันทึกและผู้ป่วยที่รับผิดชอบ
      if (role === "nurse") {
        // ตรวจสอบว่าเป็นผู้บันทึกหรือไม่
        if (treatment.nurse_id !== req.user.id) {
          return res
            .status(403)
            .json({
              message:
                "ไม่มีสิทธิ์แก้ไขข้อมูลการรักษานี้ (ต้องเป็นผู้บันทึกเท่านั้น)",
            });
        }

        // ตรวจสอบว่าเป็นผู้ป่วยที่รับผิดชอบหรือไม่
        const nursePatientResult = await req.db.query(
          "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
          [treatment.patient_id, req.user.id]
        );

        if (nursePatientResult.rows.length === 0) {
          return res
            .status(403)
            .json({
              message: "ไม่มีสิทธิ์แก้ไขข้อมูลการรักษาของผู้ป่วยรายนี้",
            });
        }
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (treatment_date) {
        updateFields.push(`treatment_date = $${paramIndex++}`);
        updateValues.push(treatment_date);
      }

      if (treatment_type) {
        updateFields.push(`treatment_type = $${paramIndex++}`);
        updateValues.push(treatment_type);
      }

      if (details) {
        updateFields.push(`details = $${paramIndex++}`);
        updateValues.push(details);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของรายการที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE treatments SET ${updateFields.join(
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

// @route   DELETE api/treatments/:id
// @desc    ลบข้อมูลการรักษา
// @access  Private/NurseOrAdmin
router.delete("/:id", authNurseOrAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่ามีการรักษานี้อยู่หรือไม่
    const treatmentResult = await req.db.query(
      "SELECT * FROM treatments WHERE id = $1",
      [req.params.id]
    );

    if (treatmentResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการรักษา" });
    }

    const treatment = treatmentResult.rows[0];

    // ตรวจสอบว่าพยาบาลมีสิทธิ์ลบหรือไม่
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // พยาบาลสามารถลบเฉพาะข้อมูลที่ตนเองบันทึกและผู้ป่วยที่รับผิดชอบ
    if (role === "nurse") {
      // ตรวจสอบว่าเป็นผู้บันทึกหรือไม่
      if (treatment.nurse_id !== req.user.id) {
        return res
          .status(403)
          .json({
            message:
              "ไม่มีสิทธิ์ลบข้อมูลการรักษานี้ (ต้องเป็นผู้บันทึกเท่านั้น)",
          });
      }

      // ตรวจสอบว่าเป็นผู้ป่วยที่รับผิดชอบหรือไม่
      const nursePatientResult = await req.db.query(
        "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
        [treatment.patient_id, req.user.id]
      );

      if (nursePatientResult.rows.length === 0) {
        return res
          .status(403)
          .json({ message: "ไม่มีสิทธิ์ลบข้อมูลการรักษาของผู้ป่วยรายนี้" });
      }
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM treatments WHERE id = $1", [req.params.id]);

    res.json({ message: "ลบข้อมูลการรักษาเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   POST api/treatments/:patient_id/medications
// @desc    บันทึกข้อมูลยาของผู้ป่วย
// @access  Private/NurseOrAdmin
router.post(
  "/:patient_id/medications",
  [
    authNurseOrAdmin,
    check("medication_name", "กรุณาระบุชื่อยา").not().isEmpty(),
    check("dosage", "กรุณาระบุขนาดยา").not().isEmpty(),
    check("frequency", "กรุณาระบุความถี่ในการรับประทาน").not().isEmpty(),
    check("start_date", "กรุณาระบุวันที่เริ่มรับประทาน").isDate(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medication_name, dosage, frequency, start_date, end_date, notes } =
      req.body;

    try {
      // ตรวจสอบว่าผู้ป่วยมีอยู่จริงหรือไม่
      const patientExists = await req.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [req.params.patient_id]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
      }

      // ตรวจสอบว่าพยาบาลรับผิดชอบผู้ป่วยนี้หรือไม่ (ยกเว้นแอดมิน)
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      if (role === "nurse") {
        const nursePatient = await req.db.query(
          "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
          [req.params.patient_id, req.user.id]
        );

        if (nursePatient.rows.length === 0) {
          return res
            .status(403)
            .json({ message: "ไม่มีสิทธิ์บันทึกข้อมูลยาของผู้ป่วยรายนี้" });
        }
      }

      // บันทึกข้อมูลยา
      const result = await req.db.query(
        "INSERT INTO medications (patient_id, medication_name, dosage, frequency, start_date, end_date, notes, prescribed_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          req.params.patient_id,
          medication_name,
          dosage,
          frequency,
          start_date,
          end_date,
          notes,
          req.user.id,
        ]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/treatments/:patient_id/medications
// @desc    ดึงข้อมูลยาของผู้ป่วย
// @access  Private
router.get("/:patient_id/medications", auth, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient") {
      const patientResult = await req.db.query(
        "SELECT id FROM patients WHERE user_id = $1",
        [req.user.id]
      );

      if (
        patientResult.rows.length === 0 ||
        patientResult.rows[0].id !== parseInt(req.params.patient_id)
      ) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
      }
    }

    // พยาบาลสามารถดูได้เฉพาะข้อมูลของผู้ป่วยที่รับผิดชอบ
    if (role === "nurse") {
      const nursePatientResult = await req.db.query(
        "SELECT * FROM patients WHERE id = $1 AND nurse_id = $2",
        [req.params.patient_id, req.user.id]
      );

      if (nursePatientResult.rows.length === 0) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
      }
    }

    // สร้างคำสั่ง SQL สำหรับดึงข้อมูลยา
    let query = `
      SELECT m.*, u.first_name as prescribed_by_first_name, u.last_name as prescribed_by_last_name 
      FROM medications m
      JOIN users u ON m.prescribed_by = u.id
      WHERE m.patient_id = $1
    `;

    // เพิ่มเงื่อนไขการกรองยาที่ยังใช้งานอยู่
    if (req.query.active === "true") {
      query += ` AND m.is_active = true`;
    }

    // จัดเรียงข้อมูล
    query += ` ORDER BY m.start_date DESC`;

    // ดึงข้อมูลยา
    const result = await req.db.query(query, [req.params.patient_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/treatments/medications/:id
// @desc    แก้ไขข้อมูลยา
// @access  Private/NurseOrAdmin
router.put(
  "/medications/:id",
  [
    authNurseOrAdmin,
    check("medication_name", "กรุณาระบุชื่อยา").optional().not().isEmpty(),
    check("dosage", "กรุณาระบุขนาดยา").optional().not().isEmpty(),
    check("frequency", "กรุณาระบุความถี่ในการรับประทาน")
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
      medication_name,
      dosage,
      frequency,
      start_date,
      end_date,
      notes,
      is_active,
    } = req.body;

    try {
      // ตรวจสอบว่ามียานี้อยู่หรือไม่
      const medicationResult = await req.db.query(
        "SELECT m.*, p.nurse_id FROM medications m JOIN patients p ON m.patient_id = p.id WHERE m.id = $1",
        [req.params.id]
      );

      if (medicationResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลยา" });
      }

      const medication = medicationResult.rows[0];

      // ตรวจสอบว่าพยาบาลมีสิทธิ์แก้ไขหรือไม่
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      // พยาบาลสามารถแก้ไขเฉพาะข้อมูลของผู้ป่วยที่รับผิดชอบ
      if (role === "nurse" && medication.nurse_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลยาของผู้ป่วยรายนี้" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (medication_name) {
        updateFields.push(`medication_name = ${paramIndex++}`);
        updateValues.push(medication_name);
      }

      if (dosage) {
        updateFields.push(`dosage = ${paramIndex++}`);
        updateValues.push(dosage);
      }

      if (frequency) {
        updateFields.push(`frequency = ${paramIndex++}`);
        updateValues.push(frequency);
      }

      if (start_date) {
        updateFields.push(`start_date = ${paramIndex++}`);
        updateValues.push(start_date);
      }

      if (end_date !== undefined) {
        updateFields.push(`end_date = ${paramIndex++}`);
        updateValues.push(end_date);
      }

      if (notes !== undefined) {
        updateFields.push(`notes = ${paramIndex++}`);
        updateValues.push(notes);
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = ${paramIndex++}`);
        updateValues.push(is_active);
      }

      updateFields.push(`updated_at = ${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของรายการที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE medications SET ${updateFields.join(
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

// @route   DELETE api/treatments/medications/:id
// @desc    ลบข้อมูลยา
// @access  Private/NurseOrAdmin
router.delete("/medications/:id", authNurseOrAdmin, async (req, res) => {
  try {
    // ตรวจสอบว่ามียานี้อยู่หรือไม่
    const medicationResult = await req.db.query(
      "SELECT m.*, p.nurse_id FROM medications m JOIN patients p ON m.patient_id = p.id WHERE m.id = $1",
      [req.params.id]
    );

    if (medicationResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลยา" });
    }

    const medication = medicationResult.rows[0];

    // ตรวจสอบว่าพยาบาลมีสิทธิ์ลบหรือไม่
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // พยาบาลสามารถลบเฉพาะข้อมูลของผู้ป่วยที่รับผิดชอบ
    if (role === "nurse" && medication.nurse_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "ไม่มีสิทธิ์ลบข้อมูลยาของผู้ป่วยรายนี้" });
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM medications WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ message: "ลบข้อมูลยาเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
