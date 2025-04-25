const express = require("express");
const router = express.Router();
const { authNurseOrAdmin } = require("../middlewares/auth");

// @route   GET api/reports/glucose
// @desc    สร้างรายงานสรุปค่าน้ำตาลเฉลี่ย
// @access  Private/NurseOrAdmin
router.get("/glucose", authNurseOrAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // ตรวจสอบว่ามีการระบุวันที่เริ่มต้นและสิ้นสุดหรือไม่
    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด" });
    }

    // ดึงข้อมูลเฉพาะพยาบาลที่ทำการค้นหา (หรือทั้งหมดสำหรับแอดมิน)
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    let nurseFilter = "";
    let params = [start_date, end_date];

    if (role === "nurse") {
      nurseFilter = " AND p.nurse_id = $3";
      params.push(req.user.id);
    }

    // สรุปค่าเฉลี่ยน้ำตาลตามประเภทการตรวจสำหรับผู้ป่วยทั้งหมด
    const readingTypeAvgResult = await req.db.query(
      `SELECT gr.reading_type, 
              ROUND(AVG(gr.glucose_value)::numeric, 2) as average_value,
              ROUND(MIN(gr.glucose_value)::numeric, 2) as min_value,
              ROUND(MAX(gr.glucose_value)::numeric, 2) as max_value,
              COUNT(*) as count
       FROM glucose_readings gr
       JOIN patients p ON gr.patient_id = p.id
       WHERE gr.reading_date BETWEEN $1 AND $2${nurseFilter}
       GROUP BY gr.reading_type
       ORDER BY 
         CASE 
           WHEN gr.reading_type = 'before_breakfast' THEN 1
           WHEN gr.reading_type = 'after_breakfast' THEN 2
           WHEN gr.reading_type = 'before_lunch' THEN 3
           WHEN gr.reading_type = 'after_lunch' THEN 4
           WHEN gr.reading_type = 'before_dinner' THEN 5
           WHEN gr.reading_type = 'after_dinner' THEN 6
           WHEN gr.reading_type = 'bedtime' THEN 7
           ELSE 8
         END`,
      params
    );

    // จำนวนผู้ป่วยที่มีค่าเฉลี่ยน้ำตาลแบ่งตามช่วง
    const glucoseRangeResult = await req.db.query(
      `WITH patient_avg AS (
         SELECT gr.patient_id, ROUND(AVG(gr.glucose_value)::numeric, 2) as avg_glucose
         FROM glucose_readings gr
         JOIN patients p ON gr.patient_id = p.id
         WHERE gr.reading_date BETWEEN $1 AND $2${nurseFilter}
         GROUP BY gr.patient_id
       )
       SELECT 
         COUNT(CASE WHEN avg_glucose < 90 THEN 1 END) as normal_count,
         COUNT(CASE WHEN avg_glucose >= 90 AND avg_glucose <= 125 THEN 1 END) as risk_count,
         COUNT(CASE WHEN avg_glucose > 125 THEN 1 END) as high_count,
         COUNT(*) as total_count
       FROM patient_avg`,
      params
    );

    // รายการผู้ป่วยที่มีค่าเฉลี่ยน้ำตาลสูงสุด 10 อันดับแรก
    const highestAvgResult = await req.db.query(
      `WITH patient_avg AS (
         SELECT gr.patient_id, ROUND(AVG(gr.glucose_value)::numeric, 2) as avg_glucose
         FROM glucose_readings gr
         JOIN patients p ON gr.patient_id = p.id
         WHERE gr.reading_date BETWEEN $1 AND $2${nurseFilter}
         GROUP BY gr.patient_id
       )
       SELECT pa.patient_id, pa.avg_glucose, u.hospital_id, u.first_name, u.last_name, 
              COUNT(gr.id) as reading_count,
              ROUND(MAX(gr.glucose_value)::numeric, 2) as max_glucose
       FROM patient_avg pa
       JOIN patients p ON pa.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       JOIN glucose_readings gr ON pa.patient_id = gr.patient_id
       WHERE gr.reading_date BETWEEN $1 AND $2
       GROUP BY pa.patient_id, pa.avg_glucose, u.hospital_id, u.first_name, u.last_name
       ORDER BY pa.avg_glucose DESC
       LIMIT 10`,
      params
    );

    // สรุปจำนวนการบันทึกค่าน้ำตาลต่อวัน
    const dailyCountResult = await req.db.query(
      `SELECT gr.reading_date, COUNT(*) as count
       FROM glucose_readings gr
       JOIN patients p ON gr.patient_id = p.id
       WHERE gr.reading_date BETWEEN $1 AND $2${nurseFilter}
       GROUP BY gr.reading_date
       ORDER BY gr.reading_date`,
      params
    );

    res.json({
      byReadingType: readingTypeAvgResult.rows,
      byGlucoseRange: glucoseRangeResult.rows[0],
      highestAvg: highestAvgResult.rows,
      dailyCount: dailyCountResult.rows,
      period: {
        start_date,
        end_date,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/reports/uncontrolled
// @desc    สร้างรายงานผู้ป่วยที่ควบคุมระดับน้ำตาลไม่ได้
// @access  Private/NurseOrAdmin
router.get("/uncontrolled", authNurseOrAdmin, async (req, res) => {
  try {
    const { start_date, end_date, threshold = 125 } = req.query;

    // ตรวจสอบว่ามีการระบุวันที่เริ่มต้นและสิ้นสุดหรือไม่
    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด" });
    }

    // ดึงข้อมูลเฉพาะพยาบาลที่ทำการค้นหา (หรือทั้งหมดสำหรับแอดมิน)
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    let nurseFilter = "";
    let params = [start_date, end_date, parseFloat(threshold)];
    let paramIndex = 4;

    if (role === "nurse") {
      nurseFilter = " AND p.nurse_id = $" + paramIndex++;
      params.push(req.user.id);
    }

    // รายชื่อผู้ป่วยที่มีค่าเฉลี่ยน้ำตาลเกินเกณฑ์
    const uncontrolledPatientsResult = await req.db.query(
      `WITH patient_metrics AS (
         SELECT 
           gr.patient_id,
           ROUND(AVG(gr.glucose_value)::numeric, 2) as avg_glucose,
           COUNT(gr.id) as reading_count,
           ROUND(MAX(gr.glucose_value)::numeric, 2) as max_glucose,
           COUNT(CASE WHEN gr.glucose_value > $3 THEN 1 END) as high_readings,
           MAX(gr.reading_date) as latest_reading_date
         FROM glucose_readings gr
         JOIN patients p ON gr.patient_id = p.id
         WHERE gr.reading_date BETWEEN $1 AND $2${nurseFilter}
         GROUP BY gr.patient_id
       )
       SELECT 
         pm.patient_id, 
         pm.avg_glucose, 
         pm.reading_count, 
         pm.max_glucose,
         pm.high_readings,
         pm.latest_reading_date,
         u.hospital_id, 
         u.first_name, 
         u.last_name,
         u.phone,
         (SELECT gr.glucose_value 
          FROM glucose_readings gr 
          WHERE gr.patient_id = pm.patient_id
          ORDER BY gr.reading_date DESC, gr.reading_time DESC 
          LIMIT 1) as latest_glucose
       FROM patient_metrics pm
       JOIN patients p ON pm.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE pm.avg_glucose > $3
       ORDER BY pm.avg_glucose DESC`,
      params
    );

    // ข้อมูลเพิ่มเติมเกี่ยวกับเกณฑ์
    const thresholdInfo = {
      value: parseFloat(threshold),
      description: `ค่าเฉลี่ยน้ำตาลในเลือดสูงกว่า ${threshold} mg/dL`,
      period: {
        start_date,
        end_date,
      },
    };

    res.json({
      uncontrolledPatients: uncontrolledPatientsResult.rows,
      threshold: thresholdInfo,
      totalCount: uncontrolledPatientsResult.rows.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/reports/monthly
// @desc    สร้างรายงานจำนวนผู้ป่วยรายเดือน
// @access  Private/NurseOrAdmin
router.get("/monthly", authNurseOrAdmin, async (req, res) => {
  try {
    // ดึงข้อมูลเฉพาะพยาบาลที่ทำการค้นหา (หรือทั้งหมดสำหรับแอดมิน)
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    let nurseFilter = "";
    let params = [];

    if (role === "nurse") {
      nurseFilter = " WHERE p.nurse_id = $1";
      params.push(req.user.id);
    }

    // จำนวนผู้ป่วยรายเดือน (12 เดือนล่าสุด)
    const monthlyCountResult = await req.db.query(
      `WITH months AS (
         SELECT TO_CHAR(date_trunc('month', current_date) - (interval '1 month' * generate_series(0, 11)), 'YYYY-MM-01') as month
       )
       SELECT 
         TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'Mon YYYY') as month_text,
         m.month,
         COUNT(DISTINCT p.id) as patient_count
       FROM months m
       LEFT JOIN patients p${nurseFilter} ON 
         TO_CHAR(p.created_at, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       GROUP BY m.month, month_text
       ORDER BY m.month DESC`,
      params
    );

    // จำนวนการบันทึกค่าน้ำตาลรายเดือน
    const monthlyReadingsResult = await req.db.query(
      `WITH months AS (
         SELECT TO_CHAR(date_trunc('month', current_date) - (interval '1 month' * generate_series(0, 11)), 'YYYY-MM-01') as month
       )
       SELECT 
         TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'Mon YYYY') as month_text,
         m.month,
         COUNT(gr.id) as reading_count
       FROM months m
       LEFT JOIN glucose_readings gr ON 
         TO_CHAR(gr.reading_date, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       LEFT JOIN patients p${nurseFilter} ON gr.patient_id = p.id
       GROUP BY m.month, month_text
       ORDER BY m.month DESC`,
      params
    );

    // สรุปผลการใช้งานระบบรายเดือน
    const systemUsageResult = await req.db.query(
      `WITH months AS (
         SELECT TO_CHAR(date_trunc('month', current_date) - (interval '1 month' * generate_series(0, 11)), 'YYYY-MM-01') as month
       )
       SELECT 
         TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'Mon YYYY') as month_text,
         m.month,
         COUNT(DISTINCT gr.patient_id) as active_patients,
         COUNT(gr.id) as glucose_readings,
         COUNT(ml.id) as meal_logs,
         COUNT(a.id) as activities,
         COUNT(wr.id) as weight_records
       FROM months m
       LEFT JOIN glucose_readings gr ON 
         TO_CHAR(gr.reading_date, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       LEFT JOIN patients p${nurseFilter} ON gr.patient_id = p.id
       LEFT JOIN meals ml ON 
         ml.patient_id = p.id AND 
         TO_CHAR(ml.meal_date, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       LEFT JOIN physical_activities a ON 
         a.patient_id = p.id AND 
         TO_CHAR(a.activity_date, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       LEFT JOIN weight_records wr ON 
         wr.patient_id = p.id AND 
         TO_CHAR(wr.record_date, 'YYYY-MM') = TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM')
       GROUP BY m.month, month_text
       ORDER BY m.month DESC`,
      params
    );

    // จำนวนผู้ป่วยที่ควบคุมระดับน้ำตาลไม่ได้รายเดือน
    const uncontrolledMonthlyResult = await req.db.query(
      `WITH months AS (
         SELECT TO_CHAR(date_trunc('month', current_date) - (interval '1 month' * generate_series(0, 11)), 'YYYY-MM-01') as month
       ),
       monthly_avg AS (
         SELECT 
           TO_CHAR(gr.reading_date, 'YYYY-MM') as reading_month,
           gr.patient_id,
           AVG(gr.glucose_value) as avg_glucose
         FROM glucose_readings gr
         JOIN patients p ON gr.patient_id = p.id${nurseFilter}
         GROUP BY reading_month, gr.patient_id
       )
       SELECT 
         TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'Mon YYYY') as month_text,
         m.month,
         COUNT(CASE WHEN ma.avg_glucose > 125 THEN 1 END) as uncontrolled_count,
         COUNT(DISTINCT ma.patient_id) as total_patients
       FROM months m
       LEFT JOIN monthly_avg ma ON 
         TO_CHAR(TO_DATE(m.month, 'YYYY-MM-DD'), 'YYYY-MM') = ma.reading_month
       GROUP BY m.month, month_text
       ORDER BY m.month DESC`,
      params
    );

    // รวมข้อมูลทั้งหมด
    const reportData = {
      patientCount: monthlyCountResult.rows,
      readingsCount: monthlyReadingsResult.rows,
      systemUsage: systemUsageResult.rows,
      uncontrolledPatients: uncontrolledMonthlyResult.rows,
    };

    res.json(reportData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/reports/patient/:id
// @desc    สร้างรายงานข้อมูลผู้ป่วยรายบุคคล
// @access  Private/NurseOrAdmin
router.get("/patient/:id", authNurseOrAdmin, async (req, res) => {
  try {
    const patientId = req.params.id;

    // ตรวจสอบว่ามีผู้ป่วยนี้อยู่หรือไม่
    const patientResult = await req.db.query(
      `SELECT p.*, u.hospital_id, u.first_name, u.last_name, u.phone, 
              u.created_at as registration_date,
              nu.first_name as nurse_first_name, nu.last_name as nurse_last_name
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users nu ON p.nurse_id = nu.id
       WHERE p.id = $1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ป่วย" });
    }

    const patient = patientResult.rows[0];

    // ตรวจสอบว่าพยาบาลมีสิทธิ์ดูข้อมูลหรือไม่
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    if (role === "nurse" && patient.nurse_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยรายนี้" });
    }

    // ข้อมูลสรุปค่าน้ำตาล
    const glucoseSummaryResult = await req.db.query(
      `SELECT 
         reading_type,
         ROUND(AVG(glucose_value)::numeric, 2) as avg_glucose,
         ROUND(MIN(glucose_value)::numeric, 2) as min_glucose,
         ROUND(MAX(glucose_value)::numeric, 2) as max_glucose,
         COUNT(*) as reading_count,
         COUNT(CASE WHEN glucose_value > 125 THEN 1 END) as high_count,
         COUNT(CASE WHEN glucose_value < 70 THEN 1 END) as low_count
       FROM glucose_readings
       WHERE patient_id = $1
       GROUP BY reading_type
       ORDER BY 
         CASE 
           WHEN reading_type = 'before_breakfast' THEN 1
           WHEN reading_type = 'after_breakfast' THEN 2
           WHEN reading_type = 'before_lunch' THEN 3
           WHEN reading_type = 'after_lunch' THEN 4
           WHEN reading_type = 'before_dinner' THEN 5
           WHEN reading_type = 'after_dinner' THEN 6
           WHEN reading_type = 'bedtime' THEN 7
           ELSE 8
         END`,
      [patientId]
    );

    // ข้อมูลสรุปการบันทึกค่าน้ำตาลรายเดือน
    const monthlyGlucoseResult = await req.db.query(
      `WITH last_months AS (
         SELECT TO_CHAR(date_trunc('month', current_date) - (interval '1 month' * generate_series(0, 5)), 'YYYY-MM-01') as month
       )
       SELECT 
         TO_CHAR(TO_DATE(lm.month, 'YYYY-MM-DD'), 'Mon YYYY') as month_text,
         ROUND(AVG(gr.glucose_value)::numeric, 2) as avg_glucose,
         COUNT(*) as reading_count
       FROM last_months lm
       LEFT JOIN glucose_readings gr ON 
         TO_CHAR(gr.reading_date, 'YYYY-MM') = TO_CHAR(TO_DATE(lm.month, 'YYYY-MM-DD'), 'YYYY-MM')
         AND gr.patient_id = $1
       GROUP BY lm.month, month_text
       ORDER BY lm.month DESC`,
      [patientId]
    );

    // ข้อมูลน้ำหนัก
    const weightResult = await req.db.query(
      `SELECT * FROM weight_records
       WHERE patient_id = $1
       ORDER BY record_date DESC`,
      [patientId]
    );

    // ข้อมูลยาปัจจุบัน
    const medicationsResult = await req.db.query(
      `SELECT m.*, u.first_name as prescribed_by_first_name, u.last_name as prescribed_by_last_name
       FROM medications m
       JOIN users u ON m.prescribed_by = u.id
       WHERE m.patient_id = $1 AND m.is_active = true
       ORDER BY m.start_date DESC`,
      [patientId]
    );

    // ข้อมูลการนัดหมายที่กำลังจะมาถึง
    const appointmentsResult = await req.db.query(
      `SELECT *
       FROM appointments
       WHERE patient_id = $1 AND appointment_date >= CURRENT_DATE AND is_completed = false
       ORDER BY appointment_date, appointment_time`,
      [patientId]
    );

    // ข้อมูลการรักษาล่าสุด
    const treatmentsResult = await req.db.query(
      `SELECT t.*, u.first_name as nurse_first_name, u.last_name as nurse_last_name
       FROM treatments t
       JOIN users u ON t.nurse_id = u.id
       WHERE t.patient_id = $1
       ORDER BY t.treatment_date DESC
       LIMIT 10`,
      [patientId]
    );

    // จำนวนการบันทึกข้อมูลทั้งหมด
    const activityCountResult = await req.db.query(
      `SELECT 
         (SELECT COUNT(*) FROM glucose_readings WHERE patient_id = $1) as glucose_count,
         (SELECT COUNT(*) FROM meals WHERE patient_id = $1) as meal_count,
         (SELECT COUNT(*) FROM physical_activities WHERE patient_id = $1) as activity_count,
         (SELECT COUNT(*) FROM weight_records WHERE patient_id = $1) as weight_count,
         (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) as appointment_count
      `,
      [patientId]
    );

    // คำนวณค่า BMI ล่าสุด
    let latestBmi = null;
    if (patient.height && weightResult.rows.length > 0) {
      const heightInMeters = patient.height / 100;
      latestBmi =
        weightResult.rows[0].weight / (heightInMeters * heightInMeters);
      latestBmi = parseFloat(latestBmi.toFixed(2));
    }

    // จัดรูปแบบข้อมูลผู้ป่วย
    const patientInfo = {
      id: patient.id,
      hospital_id: patient.hospital_id,
      name: `${patient.first_name} ${patient.last_name}`,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      registration_date: patient.registration_date,
      gestational_age_at_diagnosis: patient.gestational_age_at_diagnosis,
      expected_delivery_date: patient.expected_delivery_date,
      pre_pregnancy_weight: patient.pre_pregnancy_weight,
      height: patient.height,
      blood_type: patient.blood_type,
      previous_gdm: patient.previous_gdm,
      family_diabetes_history: patient.family_diabetes_history,
      nurse: patient.nurse_id
        ? `${patient.nurse_first_name} ${patient.nurse_last_name}`
        : null,
      latest_bmi: latestBmi,
    };

    // รวมข้อมูลทั้งหมดในรายงาน
    const reportData = {
      patient: patientInfo,
      glucoseSummary: glucoseSummaryResult.rows,
      monthlyGlucose: monthlyGlucoseResult.rows,
      weights: weightResult.rows,
      medications: medicationsResult.rows,
      appointments: appointmentsResult.rows,
      treatments: treatmentsResult.rows,
      activityCounts: activityCountResult.rows[0],
      generatedAt: new Date().toISOString(),
    };

    res.json(reportData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/reports/dashboard
// @desc    สรุปข้อมูลสำหรับแดชบอร์ด
// @access  Private/NurseOrAdmin
router.get("/dashboard", authNurseOrAdmin, async (req, res) => {
  try {
    // ดึงข้อมูลเฉพาะพยาบาลที่ทำการค้นหา (หรือทั้งหมดสำหรับแอดมิน)
    const userResult = await req.db.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    let nurseFilter = "";
    let params = [];

    if (role === "nurse") {
      nurseFilter = " WHERE p.nurse_id = $1";
      params.push(req.user.id);
    }

    // จำนวนผู้ป่วยทั้งหมด
    const totalPatientsResult = await req.db.query(
      `SELECT COUNT(*) as total_patients
       FROM patients p${nurseFilter}`,
      params
    );

    // จำนวนผู้ป่วยที่มีค่าน้ำตาลผิดปกติในวันนี้
    const abnormalTodayResult = await req.db.query(
      `SELECT COUNT(DISTINCT gr.patient_id) as abnormal_count
       FROM glucose_readings gr
       JOIN patients p ON gr.patient_id = p.id
       ${
         role === "nurse"
           ? "WHERE"
           : "WHERE gr.reading_date = CURRENT_DATE AND "
       }
       ${
         role === "nurse"
           ? "p.nurse_id = $1 AND gr.reading_date = CURRENT_DATE AND "
           : ""
       }
       (
         (gr.reading_type LIKE '%before%' AND gr.glucose_value > 95) OR
         (gr.reading_type LIKE '%after%' AND gr.glucose_value > 120) OR
         (gr.reading_type = 'bedtime' AND gr.glucose_value > 95) OR
         (gr.glucose_value < 70)
       )`,
      params
    );

    // จำนวนการนัดหมายวันนี้
    const appointmentsTodayResult = await req.db.query(
      `SELECT COUNT(*) as today_appointments
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       ${
         role === "nurse"
           ? "WHERE"
           : "WHERE a.appointment_date = CURRENT_DATE AND "
       }
       ${
         role === "nurse"
           ? "p.nurse_id = $1 AND a.appointment_date = CURRENT_DATE AND "
           : ""
       }
       a.is_completed = false`,
      params
    );

    // ค่าเฉลี่ยน้ำตาลในเลือดในช่วง 7 วันที่ผ่านมา
    const avgGlucoseDaysResult = await req.db.query(
      `SELECT ROUND(AVG(gr.glucose_value)::numeric, 2) as avg_glucose
       FROM glucose_readings gr
       JOIN patients p ON gr.patient_id = p.id
       ${
         role === "nurse"
           ? "WHERE"
           : "WHERE gr.reading_date >= CURRENT_DATE - 7 AND "
       }
       ${
         role === "nurse"
           ? "p.nurse_id = $1 AND gr.reading_date >= CURRENT_DATE - 7"
           : ""
       }`,
      params
    );

    // จำนวนผู้ป่วยตามช่วงอายุ (สำหรับแสดงในกราฟ)
    const ageGroupResult = await req.db.query(
      `SELECT 
         CASE 
           WHEN extract(year from age(CURRENT_DATE, date_of_birth)) < 20 THEN 'น้อยกว่า 20 ปี'
           WHEN extract(year from age(CURRENT_DATE, date_of_birth)) BETWEEN 20 AND 29 THEN '20-29 ปี'
           WHEN extract(year from age(CURRENT_DATE, date_of_birth)) BETWEEN 30 AND 39 THEN '30-39 ปี'
           WHEN extract(year from age(CURRENT_DATE, date_of_birth)) >= 40 THEN '40 ปีขึ้นไป'
         END as age_group,
         COUNT(*) as count
       FROM patients p
       ${nurseFilter}
       GROUP BY age_group
       ORDER BY age_group`,
      params
    );

    // รายการผู้ป่วย 5 อันดับสุดท้ายที่มีการบันทึกในระบบ
    const recentPatientsResult = await req.db.query(
      `SELECT 
         p.id, 
         u.hospital_id, 
         u.first_name, 
         u.last_name, 
         MAX(gr.reading_date) as last_reading_date,
         (SELECT glucose_value FROM glucose_readings 
          WHERE patient_id = p.id 
          ORDER BY reading_date DESC, reading_time DESC 
          LIMIT 1) as latest_glucose
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN glucose_readings gr ON gr.patient_id = p.id
       ${nurseFilter ? "WHERE p.nurse_id = $1" : ""}
       GROUP BY p.id, u.hospital_id, u.first_name, u.last_name
       ORDER BY last_reading_date DESC NULLS LAST
       LIMIT 5`,
      params
    );

    // รวมข้อมูลทั้งหมด
    const dashboardData = {
      totalPatients: parseInt(totalPatientsResult.rows[0].total_patients),
      abnormalToday: parseInt(abnormalTodayResult.rows[0].abnormal_count),
      appointmentsToday: parseInt(
        appointmentsTodayResult.rows[0].today_appointments
      ),
      avgGlucoseLast7Days: avgGlucoseDaysResult.rows[0].avg_glucose,
      patientsByAgeGroup: ageGroupResult.rows,
      recentPatients: recentPatientsResult.rows,
      generatedAt: new Date().toISOString(),
    };

    res.json(dashboardData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

// @route   GET api/reports/summary
// @desc    สรุปข้อมูลการใช้งานระบบ (สำหรับแอดมิน)
// @access  Private/Admin
router.get("/summary", authNurseOrAdmin, async (req, res) => {
  try {
    // ข้อมูลผู้ใช้งาน
    const userStatsResult = await req.db.query(
      `SELECT 
         COUNT(CASE WHEN r.name = 'patient' THEN 1 END) as patient_count,
         COUNT(CASE WHEN r.name = 'nurse' THEN 1 END) as nurse_count,
         COUNT(CASE WHEN r.name = 'admin' THEN 1 END) as admin_count,
         COUNT(*) as total_users
       FROM users u
       JOIN roles r ON u.role_id = r.id`
    );

    // ข้อมูลการบันทึกในระบบ
    const recordStatsResult = await req.db.query(
      `SELECT 
         (SELECT COUNT(*) FROM glucose_readings) as glucose_readings,
         (SELECT COUNT(*) FROM meals) as meal_logs,
         (SELECT COUNT(*) FROM physical_activities) as activities,
         (SELECT COUNT(*) FROM weight_records) as weight_records,
         (SELECT COUNT(*) FROM appointments) as appointments,
         (SELECT COUNT(*) FROM treatments) as treatments,
         (SELECT COUNT(*) FROM medications) as medications`
    );

    // ผู้ป่วยที่มีการบันทึกมากที่สุด 5 อันดับแรก
    const topPatientsResult = await req.db.query(
      `SELECT 
         p.id, 
         u.hospital_id, 
         u.first_name, 
         u.last_name,
         COUNT(gr.id) as glucose_count,
         COUNT(DISTINCT gr.reading_date) as unique_days
       FROM patients p
       JOIN users u ON p.user_id = u.id
       JOIN glucose_readings gr ON gr.patient_id = p.id
       GROUP BY p.id, u.hospital_id, u.first_name, u.last_name
       ORDER BY glucose_count DESC
       LIMIT 5`
    );

    // พยาบาลที่มีจำนวนผู้ป่วยมากที่สุด 5 อันดับแรก
    const topNursesResult = await req.db.query(
      `SELECT 
         u.id, 
         u.first_name, 
         u.last_name,
         COUNT(p.id) as patient_count
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN patients p ON p.nurse_id = u.id
       WHERE r.name = 'nurse'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY patient_count DESC
       LIMIT 5`
    );

    // ข้อมูลการใช้งานโดยเฉลี่ยต่อผู้ป่วย
    const avgUsageResult = await req.db.query(
      `SELECT 
         ROUND(AVG(glucose_count)::numeric, 2) as avg_glucose_readings,
         ROUND(AVG(meal_count)::numeric, 2) as avg_meal_logs,
         ROUND(AVG(activity_count)::numeric, 2) as avg_activities,
         ROUND(AVG(weight_count)::numeric, 2) as avg_weight_records
       FROM (
         SELECT 
           p.id,
           COUNT(gr.id) as glucose_count,
           COUNT(m.id) as meal_count,
           COUNT(a.id) as activity_count,
           COUNT(wr.id) as weight_count
         FROM patients p
         LEFT JOIN glucose_readings gr ON gr.patient_id = p.id
         LEFT JOIN meals m ON m.patient_id = p.id
         LEFT JOIN physical_activities a ON a.patient_id = p.id
         LEFT JOIN weight_records wr ON wr.patient_id = p.id
         GROUP BY p.id
       ) as patient_usage`
    );

    // รวมข้อมูลทั้งหมด
    const summaryData = {
      userStats: userStatsResult.rows[0],
      recordStats: recordStatsResult.rows[0],
      topPatients: topPatientsResult.rows,
      topNurses: topNursesResult.rows,
      avgUsage: avgUsageResult.rows[0],
      generatedAt: new Date().toISOString(),
    };

    res.json(summaryData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
});

module.exports = router;
