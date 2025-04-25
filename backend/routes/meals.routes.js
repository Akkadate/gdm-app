const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { auth, authNurseOrAdmin } = require("../middlewares/auth");

// @route   POST api/meals
// @desc    บันทึกข้อมูลอาหาร
// @access  Private
router.post(
  "/",
  [
    auth,
    check("meal_date", "กรุณาระบุวันที่").isDate(),
    check("meal_time", "กรุณาระบุเวลา").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check("meal_type", "กรุณาระบุประเภทมื้ออาหาร").not().isEmpty(),
    check("food_items", "กรุณาระบุรายการอาหาร").not().isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      meal_date,
      meal_time,
      meal_type,
      food_items,
      carbohydrate_amount,
      notes,
    } = req.body;

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

      // บันทึกข้อมูลอาหาร
      const result = await req.db.query(
        "INSERT INTO meals (patient_id, meal_date, meal_time, meal_type, food_items, carbohydrate_amount, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          patient_id,
          meal_date,
          meal_time,
          meal_type,
          food_items,
          carbohydrate_amount,
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

// @route   GET api/meals
// @desc    ดึงข้อมูลอาหารของผู้ป่วย
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
      dateFilter = ` AND meal_date BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(req.query.start_date, req.query.end_date);
      paramIndex += 2;
    } else if (req.query.days) {
      // ดึงข้อมูลย้อนหลัง X วัน
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(req.query.days));
      dateFilter = ` AND meal_date >= $${paramIndex}`;
      params.push(daysAgo.toISOString().split("T")[0]);
      paramIndex++;
    }

    // ดึงข้อมูลอาหาร
    const result = await req.db.query(
      `SELECT * FROM meals WHERE patient_id = $1${dateFilter} ORDER BY meal_date DESC, meal_time DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/meals/:id
// @desc    ดึงข้อมูลอาหารตาม ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT m.*, p.user_id FROM meals m JOIN patients p ON m.patient_id = p.id WHERE m.id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลอาหาร" });
    }

    const meal = result.rows[0];

    // ตรวจสอบสิทธิ์การเข้าถึง
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ผู้ป่วยสามารถดูได้เฉพาะข้อมูลของตนเอง
    if (role === "patient" && meal.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    res.json(meal);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   PUT api/meals/:id
// @desc    แก้ไขข้อมูลอาหาร
// @access  Private
router.put(
  "/:id",
  [
    auth,
    check("meal_date", "กรุณาระบุวันที่").optional().isDate(),
    check("meal_time", "กรุณาระบุเวลา")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check("meal_type", "กรุณาระบุประเภทมื้ออาหาร").optional().not().isEmpty(),
    check("food_items", "กรุณาระบุรายการอาหาร").optional().not().isEmpty(),
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      meal_date,
      meal_time,
      meal_type,
      food_items,
      carbohydrate_amount,
      notes,
    } = req.body;

    try {
      // ตรวจสอบว่ามีสิทธิ์แก้ไขข้อมูลหรือไม่
      const mealResult = await req.db.query(
        "SELECT m.*, p.user_id FROM meals m JOIN patients p ON m.patient_id = p.id WHERE m.id = $1",
        [req.params.id]
      );

      if (mealResult.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลอาหาร" });
      }

      const meal = mealResult.rows[0];

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
        meal.user_id !== req.user.id
      ) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (meal_date) {
        updateFields.push(`meal_date = $${paramIndex++}`);
        updateValues.push(meal_date);
      }

      if (meal_time) {
        updateFields.push(`meal_time = $${paramIndex++}`);
        updateValues.push(meal_time);
      }

      if (meal_type) {
        updateFields.push(`meal_type = $${paramIndex++}`);
        updateValues.push(meal_type);
      }

      if (food_items) {
        updateFields.push(`food_items = $${paramIndex++}`);
        updateValues.push(food_items);
      }

      if (carbohydrate_amount !== undefined) {
        updateFields.push(`carbohydrate_amount = $${paramIndex++}`);
        updateValues.push(carbohydrate_amount);
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
        `UPDATE meals SET ${updateFields.join(
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

// @route   DELETE api/meals/:id
// @desc    ลบข้อมูลอาหาร
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีสิทธิ์ลบข้อมูลหรือไม่
    const mealResult = await req.db.query(
      "SELECT m.*, p.user_id FROM meals m JOIN patients p ON m.patient_id = p.id WHERE m.id = $1",
      [req.params.id]
    );

    if (mealResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลอาหาร" });
    }

    const meal = mealResult.rows[0];

    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // ตรวจสอบสิทธิ์การลบ (ต้องเป็นเจ้าของข้อมูลหรือพยาบาล/แอดมิน)
    if (role !== "nurse" && role !== "admin" && meal.user_id !== req.user.id) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบข้อมูลนี้" });
    }

    // ลบข้อมูล
    await req.db.query("DELETE FROM meals WHERE id = $1", [req.params.id]);

    res.json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/meals/summary
// @desc    สรุปข้อมูลอาหารรายวัน/รายสัปดาห์
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
      new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split("T")[0];
    const end_date =
      req.query.end_date || new Date().toISOString().split("T")[0];

    // ค่าเฉลี่ยปริมาณคาร์โบไฮเดรตตามประเภทมื้ออาหาร
    const avgByMealTypeResult = await req.db.query(
      `SELECT meal_type, ROUND(AVG(carbohydrate_amount)::numeric, 2) as average_carbs, 
              COUNT(*) as count
       FROM meals 
       WHERE patient_id = $1 AND meal_date BETWEEN $2 AND $3 AND carbohydrate_amount IS NOT NULL
       GROUP BY meal_type`,
      [patient_id, start_date, end_date]
    );

    // ค่าเฉลี่ยปริมาณคาร์โบไฮเดรตรายวัน
    const dailyAvgResult = await req.db.query(
      `SELECT meal_date, ROUND(SUM(carbohydrate_amount)::numeric, 2) as total_carbs,
              COUNT(*) as meal_count
       FROM meals 
       WHERE patient_id = $1 AND meal_date BETWEEN $2 AND $3 AND carbohydrate_amount IS NOT NULL
       GROUP BY meal_date
       ORDER BY meal_date`,
      [patient_id, start_date, end_date]
    );

    // อาหารที่รับประทานบ่อย (ตัวอย่าง)
    const commonFoodsResult = await req.db.query(
      `SELECT food_items, COUNT(*) as count
       FROM meals
       WHERE patient_id = $1 AND meal_date BETWEEN $2 AND $3
       GROUP BY food_items
       ORDER BY count DESC
       LIMIT 5`,
      [patient_id, start_date, end_date]
    );

    res.json({
      averageByMealType: avgByMealTypeResult.rows,
      dailyCarbs: dailyAvgResult.rows,
      commonFoods: commonFoodsResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
