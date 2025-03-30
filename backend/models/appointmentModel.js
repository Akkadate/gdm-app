const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Appointment Model
 */
const appointmentModel = {
  /**
   * Find appointment by ID
   * @param {string} id - Appointment UUID
   * @returns {Promise<Object>} Appointment data
   */
  async findById(id) {
    const query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name,
             c.first_name AS created_by_first_name,
             c.last_name AS created_by_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      LEFT JOIN users c ON a.created_by = c.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @param {string} userId - ID of user creating the appointment
   * @returns {Promise<Object>} Created appointment data
   */
  async create(appointmentData, userId) {
    const query = `
      INSERT INTO appointments (
        id, patient_id, provider_id, appointment_date, appointment_time,
        duration, appointment_type, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      appointmentData.patient_id,
      appointmentData.provider_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.duration || 30, // Default 30 minutes
      appointmentData.appointment_type,
      appointmentData.status || 'scheduled', // Default status
      appointmentData.notes || null,
      userId
    ];
    
    const result = await pool.query(query, values);
    
    // Get full appointment details
    return await this.findById(result.rows[0].id);
  },

  /**
   * Update appointment
   * @param {string} id - Appointment UUID
   * @param {Object} appointmentData - Appointment data to update
   * @returns {Promise<Object>} Updated appointment data
   */
  async update(id, appointmentData) {
    // Start building the query
    let query = 'UPDATE appointments SET ';
    const columns = [];
    const values = [];
    let paramCount = 1;
    
    // Add each field that needs to be updated
    for (const [key, value] of Object.entries(appointmentData)) {
      // Skip id field
      if (key === 'id') continue;
      
      columns.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
    
    // If no fields to update, return current appointment
    if (columns.length === 0) {
      return await this.findById(id);
    }
    
    // Complete the query
    query += columns.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    // Get full appointment details
    return await this.findById(result.rows[0].id);
  },

  /**
   * List all appointments
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of appointments
   */
  async findAll(filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add filters
    if (filters.date) {
      query += ` AND a.appointment_date = $${paramCount++}`;
      queryParams.push(filters.date);
    }
    
    if (filters.status) {
      query += ` AND a.status = $${paramCount++}`;
      queryParams.push(filters.status);
    }
    
    if (filters.provider_id) {
      query += ` AND a.provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    if (filters.search) {
      query += ` AND (
        p.first_name ILIKE $${paramCount} OR 
        p.last_name ILIKE $${paramCount} OR 
        p.medical_record_number ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND a.appointment_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND a.appointment_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add sorting
    query += ' ORDER BY a.appointment_date, a.appointment_time';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },

  /**
   * Count total appointments with filters
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Appointment count
   */
  async count(filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*) 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add filters
    if (filters.date) {
      query += ` AND a.appointment_date = $${paramCount++}`;
      queryParams.push(filters.date);
    }
    
    if (filters.status) {
      query += ` AND a.status = $${paramCount++}`;
      queryParams.push(filters.status);
    }
    
    if (filters.provider_id) {
      query += ` AND a.provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    if (filters.search) {
      query += ` AND (
        p.first_name ILIKE $${paramCount} OR 
        p.last_name ILIKE $${paramCount} OR 
        p.medical_record_number ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND a.appointment_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND a.appointment_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find appointments for a specific patient
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of appointments
   */
  async findByPatient(patientId, filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT a.*, 
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name,
             concat(u.first_name, ' ', u.last_name) AS provider_name
      FROM appointments a
      JOIN users u ON a.provider_id = u.id
      WHERE a.patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add filters
    if (filters.status) {
      query += ` AND a.status = $${paramCount++}`;
      queryParams.push(filters.status);
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND a.appointment_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND a.appointment_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add sorting
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },

  /**
   * Count appointments for a specific patient with filters
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Appointment count
   */
  async countByPatient(patientId, filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*) 
      FROM appointments
      WHERE patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add filters
    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      queryParams.push(filters.status);
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND appointment_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND appointment_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete appointment by ID
   * @param {string} id - Appointment UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const query = 'DELETE FROM appointments WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  },
  
  /**
   * Count appointments by date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise<number>} Appointment count
   */
  async countByDate(date) {
    const query = `
      SELECT COUNT(*) 
      FROM appointments
      WHERE appointment_date = $1
    `;
    const result = await pool.query(query, [date]);
    return parseInt(result.rows[0].count, 10);
  },
  
  /**
   * Get appointments by date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise<Array>} List of appointments
   */
  async findByDate(date) {
    const query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.appointment_date = $1
      ORDER BY a.appointment_time
    `;
    const result = await pool.query(query, [date]);
    return result.rows;
  },
  
  /**
   * Get upcoming appointments
   * @param {number} days - Number of days ahead to look
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} List of upcoming appointments
   */
  async getUpcoming(days = 7, limit = 10) {
    const query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.appointment_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '${days} days')
      AND a.status = 'scheduled'
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },
  
  /**
   * Get recent missed appointments
   * @param {number} days - Number of days to look back
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} List of missed appointments
   */
  async getRecentMissed(days = 7, limit = 10) {
    const query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             p.risk_level
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.status = 'no-show'
      AND a.appointment_date BETWEEN (CURRENT_DATE - INTERVAL '${days} days') AND CURRENT_DATE
      ORDER BY a.appointment_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },
  
  /**
   * Get recent completed appointments
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} List of completed appointments
   */
  async getRecentCompleted(limit = 10) {
    const query = `
      SELECT a.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.status = 'completed'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },
  
  /**
   * Get appointment statistics by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Appointment statistics
   */
  async getStatsByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        status, 
        COUNT(*) AS count
      FROM appointments
      WHERE appointment_date BETWEEN $1 AND $2
      GROUP BY status
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // Format the result
    const stats = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };
    
    result.rows.forEach(row => {
      const count = parseInt(row.count, 10);
      stats.total += count;
      
      if (row.status === 'scheduled') {
        stats.scheduled = count;
      } else if (row.status === 'completed') {
        stats.completed = count;
      } else if (row.status === 'cancelled') {
        stats.cancelled = count;
      } else if (row.status === 'no-show') {
        stats.noShow = count;
      }
    });
    
    return stats;
  }
};

module.exports = appointmentModel;