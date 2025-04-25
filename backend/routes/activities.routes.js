const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   POST api/activities
// @desc    บันทึกข้อมูลกิจกรรมทางกาย
// @access  Private
router.post(
  "/",
  [
    auth,
    check("activity_date", "กรุณาระบุวันที่").isDate(),
    check("activity_type", "กรุณาระบุประเภทกิจกรรม").not().isEmpty(),
    check("duration", "กรุณาระบุระยะเวลา").isInt({ min: 1 }),
    check("intensity", "กรุณาระบุความเข้มข้น").isIn(["เบา", "ปานกลาง", "หนัก"]),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activity_date, activity_type, duration, intensity, notes } =
      req.body;
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

      // บันทึกข้อมูลกิจกรรม
      const result = await req.db.query(
        "INSERT INTO physical_activities (patient_id, activity_date, activity_type, duration, intensity, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [patient_id, activity_date, activity_type, duration, intensity, notes]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
  }
);

// @route   GET api/activities
// @desc    ดึงข้อมูลกิจกรรมทางกายของผู้ป่วย
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
      dateFilter = ` AND activity_date BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(req.query.start_date, req.query.end_date);
      paramIndex += 2;
    } else if (req.query.days) {
      // ดึงข้อมูลย้อนหลัง X วัน
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(req.query.days));
      dateFilter = ` AND activity_date >= $${paramIndex}`;
      params.push(daysAgo.toISOString().split("T")[0]);
      paramIndex++;
    }

    // ดึงข้อมูลกิจกรรม
    const result = await req.db.query(
      `SELECT * FROM physical_activities WHERE patient_id = $1${dateFilter} ORDER BY activity_date DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/activities/:id
// @desc    ดึงข้อมูลกิจกรรมตาม ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT pa.*, p.user_id FROM physical_activities pa JOIN patients p ON pa.patient_id = p.id WHERE pa.id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกิจกรรม" });
    }

    const activity = result.rows[0];

    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient" && activity.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    res.json(activity);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/activities/:id
// @desc    แก้ไขข้อมูลกิจกรรม
// @access  Private
router.put(
  "/:id",
  [
    auth,
    check("activity_date", "กรุณาระบุวันที่").optional().isDate(),
    check("activity_type", "กรุณาระบุประเภทกิจกรรม").optional().not().isEmpty(),
    check("duration", "กรุณาระบุระยะเวลา").optional().isInt({ min: 1 }),
    check("intensity", "กรุณาระบุความเข้มข้น")
      .optional()
      .isIn(["เบา", "ปานกลาง", "หนัก"]),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activity_date, activity_type, duration, intensity, notes } =
      req.body;

    try {
      // ตรวจสอบว่ามีสิทธิ์แก้ไขข้อมูลหรือไม่
      const activityResult = await req.db.query(
        "SELECT pa.*, p.user_id FROM physical_activities pa JOIN patients p ON pa.patient_id = p.id WHERE pa.id = $1",
        [req.params.id]
      );

      if (activityResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลกิจกรรม" });
      }

      const activity = activityResult.rows[0];

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
        activity.user_id !== req.user.id
      ) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (activity_date) {
        updateFields.push(`activity_date = $${paramIndex++}`);
        updateValues.push(activity_date);
      }

      if (activity_type) {
        updateFields.push(`activity_type = $${paramIndex++}`);
        updateValues.push(activity_type);
      }

      if (duration) {
        updateFields.push(`duration = $${paramIndex++}`);
        updateValues.push(duration);
      }

      if (intensity) {
        updateFields.push(`intensity = $${paramIndex++}`);
        updateValues.push(intensity);
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        updateValues.push(notes);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      updateValues.push(new Date());

      // เพิ่ม ID ของรายการที่จะอัปเดต
      updateValues.push(req.params.id);

      // อัปเดตข้อมูล
      const result = await req.db.query(
        `UPDATE physical_activities SET ${updateFields.join(
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

// @route   DELETE api/activities/:id
// @desc    ลบข้อมูลกิจกรรม
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีสิทธิ์ลบข้อมูลหรือไม่
    const activityResult = await req.db.query(
      "SELECT pa.*, p.user_id FROM physical_activities pa JOIN patients p ON pa.patient_id = p.id WHERE pa.id = $1",
      [req.params.id]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกิจกรรม" });
    }

    const activity = activityResult.rows[0];

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
      activity.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบข้อมูลนี้" });
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM physical_activities WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/activities/summary/stats
// @desc    สรุปข้อมูลกิจกรรมทางกาย
// @access  Private
router.get("/summary/stats", auth, async (req, res) => {
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

    // กำหนดช่วงวันที่
    const start_date =
      req.query.start_date ||
      new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0];
    const end_date =
      req.query.end_date || new Date().toISOString().split("T")[0];

    // สรุประยะเวลาการออกกำลังกายทั้งหมด
    const totalDurationResult = await req.db.query(
      `SELECT SUM(duration) as total_minutes,
              COUNT(*) as activity_count
       FROM physical_activities 
       WHERE patient_id = $1 AND activity_date BETWEEN $2 AND $3`,
      [patient_id, start_date, end_date]
    );

    // สรุปตามประเภทความเข้มข้น
    const intensityResult = await req.db.query(
      `SELECT intensity, SUM(duration) as duration, COUNT(*) as count
       FROM physical_activities
       WHERE patient_id = $1 AND activity_date BETWEEN $2 AND $3
       GROUP BY intensity
       ORDER BY CASE intensity
           WHEN 'เบา' THEN 1
           WHEN 'ปานกลาง' THEN 2
           WHEN 'หนัก' THEN 3
           ELSE 4
       END`,
      [patient_id, start_date, end_date]
    );

    // สรุปตามประเภทกิจกรรม
    const activityTypeResult = await req.db.query(
      `SELECT activity_type, SUM(duration) as duration, COUNT(*) as count
       FROM physical_activities
       WHERE patient_id = $1 AND activity_date BETWEEN $2 AND $3
       GROUP BY activity_type
       ORDER BY SUM(duration) DESC`,
      [patient_id, start_date, end_date]
    );

    // สรุปรายวัน
    const dailySummaryResult = await req.db.query(
      `SELECT activity_date, SUM(duration) as duration, COUNT(*) as count
       FROM physical_activities
       WHERE patient_id = $1 AND activity_date BETWEEN $2 AND $3
       GROUP BY activity_date
       ORDER BY activity_date`,
      [patient_id, start_date, end_date]
    );

    res.json({
      total: totalDurationResult.rows[0],
      byIntensity: intensityResult.rows,
      byType: activityTypeResult.rows,
      byDate: dailySummaryResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
