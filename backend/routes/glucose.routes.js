const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authNurseOrAdmin } = require('../middlewares/auth');
const moment = require('moment');

// @route   POST api/glucose
// @desc    บันทึกค่าระดับน้ำตาลในเลือด
// @access  Private
router.post(
  '/',
  [
    auth,
    check('reading_date', 'กรุณาระบุวันที่ตรวจ').isDate(),
    check('reading_time', 'กรุณาระบุเวลาตรวจ').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check('glucose_value', 'กรุณาระบุค่าน้ำตาลในเลือด').isNumeric(),
    check('reading_type', 'กรุณาระบุประเภทการตรวจ').not().isEmpty()
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reading_date, reading_time, glucose_value, reading_type, notes } = req.body;
    let patient_id = req.body.patient_id;

    try {
      // หากไม่ระบุ patient_id ให้ใช้ ID ของผู้ใช้ที่บันทึก (กรณีผู้ป่วยบันทึกเอง)
      if (!patient_id) {
        const patientResult = await req.db.query(
          'SELECT id FROM patients WHERE user_id = $1',
          [req.user.id]
        );
        
        if (patientResult.rows.length === 0) {
          return res.status(400).json({ message: 'ไม่พบข้อมูลผู้ป่วย' });
        }
        
        patient_id = patientResult.rows[0].id;
      }

      // บันทึกค่าน้ำตาลในเลือด
      const result = await req.db.query(
        'INSERT INTO glucose_readings (patient_id, reading_date, reading_time, glucose_value, reading_type, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [patient_id, reading_date, reading_time, glucose_value, reading_type, notes]
      );

      const newReading = result.rows[0];

      // ตรวจสอบว่าค่าน้ำตาลเกินเกณฑ์หรือไม่
      const targetResult = await req.db.query(
        'SELECT min_value, max_value FROM glucose_targets WHERE patient_id = $1 AND target_type = $2 ORDER BY effective_date DESC LIMIT 1',
        [patient_id, reading_type.includes('หลัง') ? 'หลังอาหาร' : 'ก่อนอาหาร']
      );

      let isAbnormal = false;
      if (targetResult.rows.length > 0) {
        const { min_value, max_value } = targetResult.rows[0];
        if (glucose_value < min_value || glucose_value > max_value) {
          isAbnormal = true;
        }
      } else {
        // กรณีไม่มีการตั้งค่าเป้าหมายเฉพาะ ใช้ค่าปกติทั่วไป
        const defaultMin = reading_type.includes('หลัง') ? 70 : 70; 
        const defaultMax = reading_type.includes('หลัง') ? 120 : 95;
        
        if (glucose_value < defaultMin || glucose_value > defaultMax) {
          isAbnormal = true;
        }
      }

      // ส่งผลการบันทึกพร้อมสถานะ
      res.json({ 
        data: newReading,
        isAbnormal
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
  }
);

// @route   GET api/glucose
// @desc    ดึงข้อมูลค่าระดับน้ำตาลในเลือดทั้งหมดของผู้ป่วย
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let patient_id;
    
    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // กรณีผู้ป่วยดูข้อมูลตัวเอง
    if (role === 'patient') {
      const patientResult = await req.db.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ป่วย' });
      }
      
      patient_id = patientResult.rows[0].id;
    } 
    // กรณีพยาบาลหรือแอดมินดูข้อมูลของผู้ป่วยคนใดคนหนึ่ง
    else if ((role === 'nurse' || role === 'admin') && req.query.patient_id) {
      patient_id = req.query.patient_id;
    } 
    // กรณีไม่ระบุ patient_id
    else {
      return res.status(400).json({ message: 'กรุณาระบุรหัสผู้ป่วย' });
    }

    // ตัวกรองตามช่วงวันที่
    let dateFilter = '';
    let params = [patient_id];
    let paramIndex = 2;
    
    if (req.query.start_date && req.query.end_date) {
      dateFilter = ` AND reading_date BETWEEN $${paramIndex} AND $${paramIndex+1}`;
      params.push(req.query.start_date, req.query.end_date);
      paramIndex += 2;
    } else if (req.query.days) {
      // ดึงข้อมูลย้อนหลัง X วัน
      const daysAgo = moment().subtract(parseInt(req.query.days), 'days').format('YYYY-MM-DD');
      dateFilter = ` AND reading_date >= $${paramIndex}`;
      params.push(daysAgo);
      paramIndex++;
    }

    // ดึงข้อมูลค่าน้ำตาลในเลือด
    const result = await req.db.query(
      `SELECT * FROM glucose_readings WHERE patient_id = $1${dateFilter} ORDER BY reading_date DESC, reading_time DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
  }
});

// @route   GET api/glucose/stats
// @desc    ดึงข้อมูลสถิติค่าระดับน้ำตาลในเลือดของผู้ป่วย
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let patient_id;
    
    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );
    const role = userResult.rows[0].role;

    // กรณีผู้ป่วยดูข้อมูลตัวเอง
    if (role === 'patient') {
      const patientResult = await req.db.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patientResult.rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ป่วย' });
      }
      
      patient_id = patientResult.rows[0].id;
    } 
    // กรณีพยาบาลหรือแอดมินดูข้อมูลของผู้ป่วยคนใดคนหนึ่ง
    else if ((role === 'nurse' || role === 'admin') && req.query.patient_id) {
      patient_id = req.query.patient_id;
    } 
    // กรณีไม่ระบุ patient_id
    else {
      return res.status(400).json({ message: 'กรุณาระบุรหัสผู้ป่วย' });
    }

    // กำหนดช่วงวันที่
    const start_date = req.query.start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
    const end_date = req.query.end_date || moment().format('YYYY-MM-DD');

    // ค่าเฉลี่ยน้ำตาลในเลือดแยกตามประเภทการตรวจ
    const avgByTypeResult = await req.db.query(
      `SELECT reading_type, ROUND(AVG(glucose_value)::numeric, 2) as average_value, 
              COUNT(*) as count,
              ROUND(MIN(glucose_value)::numeric, 2) as min_value,
              ROUND(MAX(glucose_value)::numeric, 2) as max_value
       FROM glucose_readings 
       WHERE patient_id = $1 AND reading_date BETWEEN $2 AND $3
       GROUP BY reading_type`,
      [patient_id, start_date, end_date]
    );

    // ค่าเฉลี่ยน้ำตาลในเลือดรายวัน
    const dailyAvgResult = await req.db.query(
      `SELECT reading_date, ROUND(AVG(glucose_value)::numeric, 2) as average_value
       FROM glucose_readings 
       WHERE patient_id = $1 AND reading_date BETWEEN $2 AND $3
       GROUP BY reading_date
       ORDER BY reading_date`,
      [patient_id, start_date, end_date]
    );

    // ค่าเฉลี่ยรวมทั้งหมด
    const totalAvgResult = await req.db.query(
      `SELECT ROUND(AVG(glucose_value)::numeric, 2) as total_average,
              COUNT(*) as total_readings,
              SUM(CASE WHEN glucose_value < 70 THEN 1 ELSE 0 END) as hypo_count,
              SUM(CASE WHEN glucose_value > 120 THEN 1 ELSE 0 END) as hyper_count
       FROM glucose_readings 
       WHERE patient_id = $1 AND reading_date BETWEEN $2 AND $3`,
      [patient_id, start_date, end_date]
    );

    res.json({
      averageByType: avgByTypeResult.rows,
      dailyAverage: dailyAvgResult.rows,
      totalStats: totalAvgResult.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
  }
});

// @route   PUT api/glucose/:id
// @desc    แก้ไขข้อมูลค่าระดับน้ำตาลในเลือด
// @access  Private
router.put(
  '/:id',
  [
    auth,
    check('glucose_value', 'กรุณาระบุค่าน้ำตาลในเลือด').optional().isNumeric(),
    check('reading_type', 'กรุณาระบุประเภทการตรวจที่ถูกต้อง').optional().not().isEmpty()
  ],
  async (req, res) => {
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reading_date, reading_time, glucose_value, reading_type, notes } = req.body;

    try {
      // ตรวจสอบว่ามีสิทธิ์แก้ไขข้อมูลหรือไม่
      const readingResult = await req.db.query(
        'SELECT gr.*, p.user_id FROM glucose_readings gr JOIN patients p ON gr.patient_id = p.id WHERE gr.id = $1',
        [req.params.id]
      );
      
      if (readingResult.rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลค่าน้ำตาลในเลือด' });
      }
      
      const reading = readingResult.rows[0];
      
      // ตรวจสอบบทบาทผู้ใช้
      const userResult = await req.db.query(
        'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [req.user.id]
      );
      const role = userResult.rows[0].role;
      
      // ตรวจสอบสิทธิ์การแก้ไข (ต้องเป็นเจ้าของข้อมูลหรือพยาบาล/แอดมิน)
      if (role !== 'nurse' && role !== 'admin' && reading.user_id !== req.user.id) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้' });
      }

      // สร้างคำสั่ง SQL สำหรับอัปเดต
      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;
      
      if (reading_date) {
        updateFields.push(`reading_date = $${paramIndex++}`);
        updateValues.push(reading_date);
      }
      
      if (reading_time) {
        updateFields.push(`reading_time = $${paramIndex++}`);
        updateValues.push(reading_time);
      }
      
      if (glucose_value) {
        updateFields.push(`glucose_value = $${paramIndex++}`);
        updateValues.push(glucose_value);
      }
      
      if (reading_type) {
        updateFields.push(`reading_type = $${paramIndex++}`);
        updateValues.push(reading_type);
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
        `UPDATE glucose_readings SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
  }
);

// @route   DELETE api/glucose/:id
// @desc    ลบข้อมูลค่าระดับน้ำตาลในเลือด
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีสิทธิ์ลบข้อมูลหรือไม่
    const readingResult = await req.db.query(
      'SELECT gr.*, p.user_id FROM glucose_readings gr JOIN patients p ON gr.patient_id = p.id WHERE gr.id = $1',
      [req.params.id]
    );
    
    if (readingResult.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลค่าน้ำตาลในเลือด' });
    }
    
    const reading = readingResult.rows[0];
    
    // ตรวจสอบบทบาทผู้ใช้
    const userResult = await req.db.query(
      'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );
    const role = userResult.rows[0].role;
    
    // ตรวจสอบสิทธิ์การลบ (ต้องเป็นเจ้าของข้อมูลหรือพยาบาล/แอดมิน)
    if (role !== 'nurse' && role !== 'admin' && reading.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบข้อมูลนี้' });
    }

    // ลบข้อมูล
    await req.db.query(
      'DELETE FROM glucose_readings WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'ลบข้อมูลเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
  }
});

module.exports = router;