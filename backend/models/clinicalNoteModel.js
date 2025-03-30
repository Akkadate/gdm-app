const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Clinical Note Model
 */
const clinicalNoteModel = {
  /**
   * Find note by ID
   * @param {string} id - Note UUID
   * @returns {Promise<Object>} Note data
   */
  async findById(id) {
    const query = `
      SELECT c.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.provider_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Create a new clinical note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note data
   */
  async create(noteData) {
    const query = `
      INSERT INTO clinical_notes (
        id, patient_id, appointment_id, provider_id, note_date,
        note_text, diagnosis, treatment_plan, followup_instructions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      noteData.patient_id,
      noteData.appointment_id || null,
      noteData.provider_id,
      noteData.note_date || new Date().toISOString().split('T')[0], // Default to today
      noteData.note_text,
      noteData.diagnosis || null,
      noteData.treatment_plan || null,
      noteData.followup_instructions || null
    ];
    
    const result = await pool.query(query, values);
    
    // Get full note details
    return await this.findById(result.rows[0].id);
  },

  /**
   * Update clinical note
   * @param {string} id - Note UUID
   * @param {Object} noteData - Note data to update
   * @returns {Promise<Object>} Updated note data
   */
  async update(id, noteData) {
    // Start building the query
    let query = 'UPDATE clinical_notes SET ';
    const columns = [];
    const values = [];
    let paramCount = 1;
    
    // Add each field that needs to be updated
    for (const [key, value] of Object.entries(noteData)) {
      // Skip id field
      if (key === 'id') continue;
      
      columns.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
    
    // If no fields to update, return current note
    if (columns.length === 0) {
      return await this.findById(id);
    }
    
    // Complete the query
    query += columns.join(', ');
    query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    
    // Get full note details
    return await this.findById(result.rows[0].id);
  },

  /**
   * Find notes for a specific patient
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of notes
   */
  async findByPatient(patientId, filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT c.*, 
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name,
             concat(u.first_name, ' ', u.last_name) AS provider_name
      FROM clinical_notes c
      JOIN users u ON c.provider_id = u.id
      WHERE c.patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND c.note_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND c.note_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add appointment filter
    if (filters.appointment_id) {
      query += ` AND c.appointment_id = $${paramCount++}`;
      queryParams.push(filters.appointment_id);
    }
    
    // Add provider filter
    if (filters.provider_id) {
      query += ` AND c.provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    // Add text search filter
    if (filters.search) {
      query += ` AND (
        c.note_text ILIKE $${paramCount} OR 
        c.diagnosis::text ILIKE $${paramCount} OR 
        c.treatment_plan ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    // Add sorting
    query += ' ORDER BY c.note_date DESC, c.created_at DESC';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },

  /**
   * Count notes for a specific patient with filters
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Note count
   */
  async countByPatient(patientId, filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*) 
      FROM clinical_notes
      WHERE patient_id = $1
    `;
    
    const queryParams = [patientId];
    let paramCount = 2;
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND note_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND note_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add appointment filter
    if (filters.appointment_id) {
      query += ` AND appointment_id = $${paramCount++}`;
      queryParams.push(filters.appointment_id);
    }
    
    // Add provider filter
    if (filters.provider_id) {
      query += ` AND provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    // Add text search filter
    if (filters.search) {
      query += ` AND (
        note_text ILIKE $${paramCount} OR 
        diagnosis::text ILIKE $${paramCount} OR 
        treatment_plan ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete note by ID
   * @param {string} id - Note UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const query = 'DELETE FROM clinical_notes WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  },
  
  /**
   * Get recent clinical notes
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} List of recent notes
   */
  async getRecent(limit = 10) {
    const query = `
      SELECT c.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.provider_id = u.id
      ORDER BY c.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  },
  
  /**
   * Find notes for a specific appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Array>} List of notes
   */
  async findByAppointment(appointmentId) {
    const query = `
      SELECT c.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.provider_id = u.id
      WHERE c.appointment_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [appointmentId]);
    return result.rows;
  },
  
  /**
   * Count notes by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<number>} Note count
   */
  async countByDateRange(startDate, endDate) {
    const query = `
      SELECT COUNT(*) 
      FROM clinical_notes
      WHERE note_date BETWEEN $1 AND $2
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0].count, 10);
  },
  
  /**
   * Search notes by text
   * @param {string} searchText - Text to search for
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of matching notes
   */
  async search(searchText, limit = 20, offset = 0) {
    const query = `
      SELECT c.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.provider_id = u.id
      WHERE 
        c.note_text ILIKE $1 OR 
        c.diagnosis::text ILIKE $1 OR 
        c.treatment_plan ILIKE $1
      ORDER BY c.note_date DESC, c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [`%${searchText}%`, limit, offset]);
    return result.rows;
  },
  
  /**
   * Get all clinical notes with pagination and filtering
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of notes
   */
  async findAll(filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT c.*, 
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             p.medical_record_number,
             u.first_name AS provider_first_name,
             u.last_name AS provider_last_name
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.provider_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add patient filter
    if (filters.patient_id) {
      query += ` AND c.patient_id = $${paramCount++}`;
      queryParams.push(filters.patient_id);
    }
    
    // Add provider filter
    if (filters.provider_id) {
      query += ` AND c.provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND c.note_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND c.note_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add text search filter
    if (filters.search) {
      query += ` AND (
        c.note_text ILIKE $${paramCount} OR 
        c.diagnosis::text ILIKE $${paramCount} OR 
        c.treatment_plan ILIKE $${paramCount} OR
        p.first_name ILIKE $${paramCount} OR
        p.last_name ILIKE $${paramCount} OR
        p.medical_record_number ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    // Add sorting
    query += ' ORDER BY c.note_date DESC, c.created_at DESC';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },
  
  /**
   * Count all notes with filters
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Note count
   */
  async count(filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*) 
      FROM clinical_notes c
      JOIN patients p ON c.patient_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add patient filter
    if (filters.patient_id) {
      query += ` AND c.patient_id = $${paramCount++}`;
      queryParams.push(filters.patient_id);
    }
    
    // Add provider filter
    if (filters.provider_id) {
      query += ` AND c.provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    // Add date range filter
    if (filters.start_date) {
      query += ` AND c.note_date >= $${paramCount++}`;
      queryParams.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ` AND c.note_date <= $${paramCount++}`;
      queryParams.push(filters.end_date);
    }
    
    // Add text search filter
    if (filters.search) {
      query += ` AND (
        c.note_text ILIKE $${paramCount} OR 
        c.diagnosis::text ILIKE $${paramCount} OR 
        c.treatment_plan ILIKE $${paramCount} OR
        p.first_name ILIKE $${paramCount} OR
        p.last_name ILIKE $${paramCount} OR
        p.medical_record_number ILIKE $${paramCount}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramCount++;
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  }
};

module.exports = clinicalNoteModel;