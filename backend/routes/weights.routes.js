const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   POST api/weights
// @desc    บันทึกข้อมูลน้ำหนัก
// @access  Private
router.post(
  "/",
  [
    auth,
    check("record_date", "กรุณาระบุวันที่").isDate(),
    check("weight", "กรุณาระบุน้ำหนัก").isFloat({ min: 30, max: 200 }),
    check("gestational_age", "อายุครรภ์ต้องอยู่ระหว่าง 1-42 สัปดาห์")
      .optional()
      .isInt({ min: 1, max: 42 }),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { record_date, weight, gestational_age, notes } = req.body;
    let patient_id = req.body.patient_id;

    try {
      // หากไม่ระบุ patient_id ให้ใช้ ID ของผู้ใช้ที่บันทึก (กรณีผู้ป่วยบันทึกเอง)
      if (!patient_id) {
        const patientResult = await req.db.query(
          "SELECT id FROM patients WHERE user_id = $1",
          [req.user.id]
        );

        if (patientResult.rows.length === 0) {
          return res.status(400).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
        }

        patient_id = patientResult.rows[0].id;
      }

      // บันทึกข้อมูลน้ำหนัก
      const result = await req.db.query(
        "INSERT INTO weight_records (patient_id, record_date, weight, gestational_age, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [patient_id, record_date, weight, gestational_age, notes]
      );

      // ดึงข้อมูลน้ำหนักก่อนตั้งครรภ์และส่วนสูงของผู้ป่วย
      const patientResult = await req.db.query(
        "SELECT pre_pregnancy_weight, height FROM patients WHERE id = $1",
        [patient_id]
      );

      const { pre_pregnancy_weight, height } = patientResult.rows[0];

      // คำนวณค่า BMI และน้ำหนักที่เพิ่มขึ้น
      let bmi = null;
      let weight_gain = null;

      if (height) {
        const heightInMeters = height / 100;
        bmi = weight / (heightInMeters * heightInMeters);
      }

      if (pre_pregnancy_weight) {
        weight_gain = weight - pre_pregnancy_weight;
      }

      res.json({
        ...result.rows[0],
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
        weight_gain: weight_gain ? parseFloat(weight_gain.toFixed(2)) : null,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/weights
// @desc    ดึงข้อมูลน้ำหนักของผู้ป่วย
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
    // กรณีไม่ระบุ patient_id
    else {
      return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
    }

    // ตัวกรองตามช่วงวันที่
    let dateFilter = "";
    let params = [patient_id];
    let paramIndex = 2;

    if (req.query.start_date && req.query.end_date) {
      dateFilter = ` AND record_date BETWEEN ${paramIndex} AND ${
        paramIndex + 1
      }`;
      params.push(req.query.start_date, req.query.end_date);
      paramIndex += 2;
    } else if (req.query.days) {
      // ดึงข้อมูลย้อนหลัง X วัน
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(req.query.days));
      dateFilter = ` AND record_date >= ${paramIndex}`;
      params.push(daysAgo.toISOString().split("T")[0]);
      paramIndex++;
    }

    // ดึงข้อมูลน้ำหนัก
    const result = await req.db.query(
      `SELECT * FROM weight_records WHERE patient_id = $1${dateFilter} ORDER BY record_date DESC`,
      params
    );

    // ดึงข้อมูลน้ำหนักก่อนตั้งครรภ์และส่วนสูงของผู้ป่วย
    const patientResult = await req.db.query(
      "SELECT pre_pregnancy_weight, height FROM patients WHERE id = $1",
      [patient_id]
    );

    const { pre_pregnancy_weight, height } = patientResult.rows[0];

    // เพิ่มข้อมูล BMI และน้ำหนักที่เพิ่มขึ้น
    const weightRecords = result.rows.map((record) => {
      let bmi = null;
      let weight_gain = null;

      if (height) {
        const heightInMeters = height / 100;
        bmi = record.weight / (heightInMeters * heightInMeters);
      }

      if (pre_pregnancy_weight) {
        weight_gain = record.weight - pre_pregnancy_weight;
      }

      return {
        ...record,
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
        weight_gain: weight_gain ? parseFloat(weight_gain.toFixed(2)) : null,
      };
    });

    res.json(weightRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/weights/latest
// @desc    ดึงข้อมูลน้ำหนักล่าสุดของผู้ป่วย
// @access  Private
router.get("/latest", auth, async (req, res) => {
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
    // กรณีไม่ระบุ patient_id
    else {
      return res.status(400).json({ message: "กรุณาระบุรหัสผู้ป่วย" });
    }

    // ดึงข้อมูลน้ำหนักล่าสุด
    const result = await req.db.query(
      "SELECT * FROM weight_records WHERE patient_id = $1 ORDER BY record_date DESC LIMIT 1",
      [patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลน้ำหนัก" });
    }

    // ดึงข้อมูลน้ำหนักก่อนตั้งครรภ์และส่วนสูงของผู้ป่วย
    const patientResult = await req.db.query(
      "SELECT pre_pregnancy_weight, height FROM patients WHERE id = $1",
      [patient_id]
    );

    const { pre_pregnancy_weight, height } = patientResult.rows[0];

    // คำนวณค่า BMI และน้ำหนักที่เพิ่มขึ้น
    let bmi = null;
    let weight_gain = null;
    const record = result.rows[0];

    if (height) {
      const heightInMeters = height / 100;
      bmi = record.weight / (heightInMeters * heightInMeters);
    }

    if (pre_pregnancy_weight) {
      weight_gain = record.weight - pre_pregnancy_weight;
    }

    res.json({
      ...record,
      bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
      weight_gain: weight_gain ? parseFloat(weight_gain.toFixed(2)) : null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/weights/:id
// @desc    ดึงข้อมูลน้ำหนักตาม ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT wr.*, p.user_id FROM weight_records wr JOIN patients p ON wr.patient_id = p.id WHERE wr.id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลน้ำหนัก" });
    }

    const weightRecord = result.rows[0];

    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient" && weightRecord.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    // ดึงข้อมูลน้ำหนักก่อนตั้งครรภ์และส่วนสูงของผู้ป่วย
    const patientResult = await req.db.query(
      "SELECT pre_pregnancy_weight, height FROM patients WHERE id = $1",
      [weightRecord.patient_id]
    );

    const { pre_pregnancy_weight, height } = patientResult.rows[0];

    // คำนวณค่า BMI และน้ำหนักที่เพิ่มขึ้น
    let bmi = null;
    let weight_gain = null;

    if (height) {
      const heightInMeters = height / 100;
      bmi = weightRecord.weight / (heightInMeters * heightInMeters);
    }

    if (pre_pregnancy_weight) {
      weight_gain = weightRecord.weight - pre_pregnancy_weight;
    }

    res.json({
      ...weightRecord,
      bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
      weight_gain: weight_gain ? parseFloat(weight_gain.toFixed(2)) : null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/weights/:id
// @desc    แก้ไขข้อมูลน้ำหนัก
// @access  Private
router.put(
  "/:id",
  [
    auth,
    check("record_date", "กรุณาระบุวันที่").optional().isDate(),
    check("weight", "กรุณาระบุน้ำหนัก")
      .optional()
      .isFloat({ min: 30, max: 200 }),
    check("gestational_age", "อายุครรภ์ต้องอยู่ระหว่าง 1-42 สัปดาห์")
      .optional()
      .isInt({ min: 1, max: 42 }),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { record_date, weight, gestational_age, notes } = req.body;

    try {
      // ตรวจสอบว่ามีสิทธิ์แก้ไขข้อมูลหรือไม่
      const weightResult = await req.db.query(
        "SELECT wr.*, p.user_id FROM weight_records wr JOIN patients p ON wr.patient_id = p.id WHERE wr.id = $1",
        [req.params.id]
      );

      if (weightResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลน้ำหนัก" });
      }

      const weightRecord = weightResult.rows[0];

      // ตรวจสอบบทบาทผู้ใช้
      const userResult = await req.db.query(
        "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
        [req.user.id]
      );
      const role = userResult.rows[0].role;

      // ตรวจสอบสิทธิ์การแก้ไข (ต้องเป็นเจ้าของข้อมูลหรือพยาบาล/แอดมิน)
      if (
        role !== "nurse" &&
        role !== "admin" &&
        weightRecord.user_id !== req.user.id
      ) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (record_date) {
        updateFields.push(`record_date = ${paramIndex++}`);
        updateValues.push(record_date);
      }

      if (weight) {
        updateFields.push(`weight = ${paramIndex++}`);
        updateValues.push(weight);
      }

      if (gestational_age !== undefined) {
        updateFields.push(`gestational_age = ${paramIndex++}`);
        updateValues.push(gestational_age);
      }

      if (notes !== undefined) {
        updateFields.push(`notes = ${paramIndex++}`);
        updateValues.push(notes);
      }

      updateFields.push(`updated_at = ${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของรายการที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE weight_records SET ${updateFields.join(
          ", "
        )} WHERE id = ${paramIndex} RETURNING *`,
        updateValues
      );

      // ดึงข้อมูลน้ำหนักก่อนตั้งครรภ์และส่วนสูงของผู้ป่วย
      const patientResult = await req.db.query(
        "SELECT pre_pregnancy_weight, height FROM patients WHERE id = $1",
        [weightRecord.patient_id]
      );

      const { pre_pregnancy_weight, height } = patientResult.rows[0];

      // คำนวณค่า BMI และน้ำหนักที่เพิ่มขึ้น
      let bmi = null;
      let weight_gain = null;
      const updatedRecord = result.rows[0];

      if (height) {
        const heightInMeters = height / 100;
        bmi = updatedRecord.weight / (heightInMeters * heightInMeters);
      }

      if (pre_pregnancy_weight) {
        weight_gain = updatedRecord.weight - pre_pregnancy_weight;
      }

      res.json({
        ...updatedRecord,
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
        weight_gain: weight_gain ? parseFloat(weight_gain.toFixed(2)) : null,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   DELETE api/weights/:id
// @desc    ลบข้อมูลน้ำหนัก
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีสิทธิ์ลบข้อมูลหรือไม่
    const weightResult = await req.db.query(
      "SELECT wr.*, p.user_id FROM weight_records wr JOIN patients p ON wr.patient_id = p.id WHERE wr.id = $1",
      [req.params.id]
    );

    if (weightResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลน้ำหนัก" });
    }

    const weightRecord = weightResult.rows[0];

    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ตรวจสอบสิทธิ์การลบ (ต้องเป็นเจ้าของข้อมูลหรือพยาบาล/แอดมิน)
    if (
      role !== "nurse" &&
      role !== "admin" &&
      weightRecord.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบข้อมูลนี้" });
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM weight_records WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
