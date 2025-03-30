const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Glucose Reading Model
 */
const glucoseReadingModel = {
  /**
   * Find reading by ID
   * @param {string} id - Reading UUID
   * @returns {Promise<Object>} Reading data
   */
  async findById(id) {
    const query = `
      SELECT g.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             u.first_name AS created_by_first_name,
             u.last_name AS created_by_last_name
      FROM glucose_readings g
      JOIN patients p ON g.patient_id = p.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Create a new glucose reading
   * @param {Object} readingData - Reading data
   * @param {string} userId - ID of user creating the reading
   * @returns {Promise<Object>} Created reading data
   */
  async create(readingData, userId) {
    // Determine if reading is out of range based on reading type
    let outOfRange = false;
    
    // Thresholds based on common guidelines for gestational diabetes
    if (readingData.reading_type === 'fasting' && readingData.glucose_value > 95) {
      outOfRange = true;
    } else if (readingData.reading_type === 'post-meal' && readingData.glucose_value > 140) {
      outOfRange = true;
    } else if (readingData.glucose_value > 180) { // General high threshold
      outOfRange = true;
    }
    
    const query = `
      INSERT INTO glucose_readings (
        id, patient_id, reading_date, reading_time, reading_type,
        glucose_value, notes, out_of_range, is_manually_entered,
        device_info, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      readingData.patient_id,
      readingData.reading_date,
      readingData.reading_time,
      readingData.reading_type,
      readingData.glucose_value,
      readingData.notes || null,
      outOfRange,
      readingData.is_manually_entered !== undefined ? readingData.is_manually_entered : true,
      readingData.device_info || null,
      userId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Update glucose reading
   * @param {string} id - Reading UUID
   * @param {Object} readingData - Reading data to update
   * @returns {Promise<Object>} Updated reading data
   */
  async update(id, readingData) {
    // Start building the query
    let query = 'UPDATE glucose_readings SET ';
    const columns = [];
    const values = [];
    let paramCount = 1;
    
    // Add each field that needs to be updated
    for (const [key, value] of Object.entries(readingData)) {
      // Skip id field
      if (key === 'id') continue;
      
      columns.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
    
    // If glucose_value is updated, recalculate out_of_range
    if (readingData.glucose_value || readingData.reading_type) {
      // Get current reading to determine reading_type if not provided
      const currentReading = await this.findById(id);
      const readingType = readingData.reading_type || currentReading.reading_type;
      const glucoseValue = readingData.glucose_value || currentReading.glucose_value;
      
      let outOfRange = false;
      
      if (readingType === 'fasting' && glucoseValue > 95) {
        outOfRange = true;
      } else if (readingType === 'post-meal' && glucoseValue > 140) {
        outOfRange = true;
      } else if (glucoseValue > 180) {
        outOfRange = true;
      }
      
      columns.push(`out_of_range = $${paramCount++}`);
      values.push(outOfRange);
    }
    
    // If no fields to update, return current reading
    if (columns.length === 0) {
      return await this.findById(id);
    }
    
    // Complete the query
    query += columns.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Get readings for a patient with pagination and filtering
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of readings
   */
  async findByPatient(patientId, filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT *
      FROM glucose_readings
      WHERE patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND reading_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND reading_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add reading type filter
    if (filters.reading_type) {
      query += ` AND reading_type = $${paramCount++}`;
      queryParams.push(filters.reading_type);
    }
    
    // Add out of range filter
    if (filters.out_of_range !== undefined) {
      query += ` AND out_of_range = $${paramCount++}`;
      queryParams.push(filters.out_of_range);
    }
    
    // Add sorting
    query += ' ORDER BY reading_date DESC, reading_time DESC';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },

  /**
   * Count total readings for a patient with filters
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Reading count
   */
  async countByPatient(patientId, filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*)
      FROM glucose_readings
      WHERE patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND reading_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND reading_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add reading type filter
    if (filters.reading_type) {
      query += ` AND reading_type = $${paramCount++}`;
      queryParams.push(filters.reading_type);
    }
    
    // Add out of range filter
    if (filters.out_of_range !== undefined) {
      query += ` AND out_of_range = $${paramCount++}`;
      queryParams.push(filters.out_of_range);
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete reading by ID
   * @param {string} id - Reading UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const query = 'DELETE FROM glucose_readings WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  },
  
  /**
   * Get average glucose values by type for a patient in a date range
   * @param {string} patientId - Patient UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Average values by type
   */
  async getAveragesByType(patientId, startDate, endDate) {
    const query = `
      SELECT 
        reading_type,
        AVG(glucose_value) AS average_value,
        COUNT(*) AS reading_count
      FROM glucose_readings
      WHERE 
        patient_id = $1
        AND reading_date BETWEEN $2 AND $3
      GROUP BY reading_type
    `;
    
    const result = await pool.query(query, [patientId, startDate, endDate]);
    
    // Format the result
    const averages = {
      fasting: null,
      'pre-meal': null,
      'post-meal': null,
      bedtime: null,
      overall: null
    };
    
    let totalSum = 0;
    let totalCount = 0;
    
    result.rows.forEach(row => {
      averages[row.reading_type] = {
        average: Math.round(parseFloat(row.average_value) * 10) / 10,
        count: parseInt(row.reading_count, 10)
      };
      
      totalSum += parseFloat(row.average_value) * parseInt(row.reading_count, 10);
      totalCount += parseInt(row.reading_count, 10);
    });
    
    if (totalCount > 0) {
      averages.overall = {
        average: Math.round((totalSum / totalCount) * 10) / 10,
        count: totalCount
      };
    }
    
    return averages;
  },
  
  /**
   * Get glucose readings by date for a patient in a date range
   * @param {string} patientId - Patient UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Daily average readings
   */
  async getDailyAverages(patientId, startDate, endDate) {
    const query = `
      SELECT 
        reading_date,
        AVG(CASE WHEN reading_type = 'fasting' THEN glucose_value ELSE NULL END) AS avg_fasting,
        AVG(CASE WHEN reading_type = 'pre-meal' THEN glucose_value ELSE NULL END) AS avg_pre_meal,
        AVG(CASE WHEN reading_type = 'post-meal' THEN glucose_value ELSE NULL END) AS avg_post_meal,
        AVG(CASE WHEN reading_type = 'bedtime' THEN glucose_value ELSE NULL END) AS avg_bedtime,
        AVG(glucose_value) AS avg_overall,
        COUNT(*) AS reading_count
      FROM glucose_readings
      WHERE 
        patient_id = $1
        AND reading_date BETWEEN $2 AND $3
      GROUP BY reading_date
      ORDER BY reading_date
    `;
    
    const result = await pool.query(query, [patientId, startDate, endDate]);
    return result.rows;
  },
  
  /**
   * Get recent out-of-range readings across all patients
   * @param {number} days - Number of days to look back
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} List of out-of-range readings with patient info
   */
  async getRecentOutOfRange(days = 7, limit = 10) {
    const query = `
      SELECT g.*,
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level
      FROM glucose_readings g
      JOIN patients p ON g.patient_id = p.id
      WHERE 
        g.out_of_range = true
        AND g.reading_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY g.reading_date DESC, g.reading_time DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  },
  
  /**
   * Get compliance statistics by patient
   * @param {string} patientId - Patient UUID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Compliance statistics
   */
  async getComplianceStats(patientId, days = 14) {
    // Get expected and actual readings
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days - 1} days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      ),
      expected_readings AS (
        SELECT 
          ds.date,
          CASE 
            WHEN p.risk_level = 'high' THEN 4
            WHEN p.risk_level = 'medium' THEN 2
            ELSE 1
          END AS expected_count
        FROM date_series ds
        CROSS JOIN patients p
        WHERE p.id = $1
      ),
      actual_readings AS (
        SELECT 
          reading_date,
          COUNT(*) AS actual_count
        FROM glucose_readings
        WHERE 
          patient_id = $1
          AND reading_date >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY reading_date
      )
      
      SELECT 
        er.date,
        er.expected_count,
        COALESCE(ar.actual_count, 0) AS actual_count
      FROM expected_readings er
      LEFT JOIN actual_readings ar ON er.date = ar.reading_date
      ORDER BY er.date
    `;
    
    const result = await pool.query(query, [patientId]);
    
    // Calculate compliance statistics
    let totalExpected = 0;
    let totalActual = 0;
    let compliantDays = 0;
    
    const dailyData = result.rows.map(row => {
      const date = row.date;
      const expected = parseInt(row.expected_count, 10);
      const actual = parseInt(row.actual_count, 10);
      const isCompliant = actual >= expected;
      
      totalExpected += expected;
      totalActual += actual;
      if (isCompliant) compliantDays++;
      
      return {
        date,
        expected,
        actual,
        compliant: isCompliant
      };
    });
    
    return {
      compliance_rate: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0,
      compliant_days: compliantDays,
      total_days: days,
      daily_data: dailyData
    };
  }
};

module.exports = glucoseReadingModel;
