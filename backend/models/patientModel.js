const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Patient Model
 */
const patientModel = {
  /**
   * Find patient by ID
   * @param {string} id - Patient UUID
   * @returns {Promise<Object>} Patient data
   */
  async findById(id) {
    const query = `
      SELECT p.*, 
             u.first_name AS provider_first_name, 
             u.last_name AS provider_last_name
      FROM patients p
      LEFT JOIN users u ON p.primary_provider_id = u.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Find patient by medical record number
   * @param {string} mrn - Medical record number
   * @returns {Promise<Object>} Patient data
   */
  async findByMRN(mrn) {
    const query = `
      SELECT p.*, 
             u.first_name AS provider_first_name, 
             u.last_name AS provider_last_name
      FROM patients p
      LEFT JOIN users u ON p.primary_provider_id = u.id
      WHERE p.medical_record_number = $1
    `;
    const result = await pool.query(query, [mrn]);
    return result.rows[0];
  },

  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @param {string} userId - ID of user creating the patient
   * @returns {Promise<Object>} Created patient data
   */
  async create(patientData, userId) {
    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (patientData.height && patientData.pre_pregnancy_weight) {
      // BMI = weight(kg) / (height(m))^2
      const heightInMeters = patientData.height / 100;
      bmi = patientData.pre_pregnancy_weight / (heightInMeters * heightInMeters);
      bmi = Math.round(bmi * 100) / 100; // Round to 2 decimal places
    }

    // Prepare risk factors array
    const riskFactors = [];
    if (patientData.family_history_diabetes) riskFactors.push('Family history of diabetes');
    if (patientData.previous_gdm) riskFactors.push('Previous GDM');
    if (patientData.previous_macrosomia) riskFactors.push('Previous macrosomia');
    if (bmi && bmi >= 30) riskFactors.push('BMI ≥ 30');
    if (patientData.age && patientData.age >= 35) riskFactors.push('Age ≥ 35');

    // Calculate risk level based on risk factors
    let riskLevel = 'low';
    if (riskFactors.length >= 3 || patientData.previous_gdm) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }

    const query = `
      INSERT INTO patients (
        id, medical_record_number, first_name, last_name, 
        date_of_birth, phone_number, email, address, 
        emergency_contact, emergency_phone, estimated_delivery_date, 
        weeks_pregnant, gravida, para, pre_pregnancy_weight, 
        current_weight, height, bmi, family_history_diabetes, 
        previous_gdm, previous_macrosomia, risk_level, 
        risk_factors, primary_provider_id, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19, 
        $20, $21, $22, $23, $24, $25
      )
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      patientData.medical_record_number,
      patientData.first_name,
      patientData.last_name,
      patientData.date_of_birth,
      patientData.phone_number,
      patientData.email || null,
      patientData.address || null,
      patientData.emergency_contact || null,
      patientData.emergency_phone || null,
      patientData.estimated_delivery_date || null,
      patientData.weeks_pregnant || null,
      patientData.gravida || null,
      patientData.para || null,
      patientData.pre_pregnancy_weight || null,
      patientData.current_weight || null,
      patientData.height || null,
      bmi,
      patientData.family_history_diabetes || false,
      patientData.previous_gdm || false,
      patientData.previous_macrosomia || false,
      riskLevel,
      riskFactors.length > 0 ? riskFactors : null,
      patientData.primary_provider_id || null,
      userId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Update patient
   * @param {string} id - Patient UUID
   * @param {Object} patientData - Patient data to update
   * @returns {Promise<Object>} Updated patient data
   */
  async update(id, patientData) {
    // Start building the query
    let query = 'UPDATE patients SET ';
    const columns = [];
    const values = [];
    let paramCount = 1;
    
    // Add each field that needs to be updated
    for (const [key, value] of Object.entries(patientData)) {
      // Skip id field
      if (key === 'id') continue;
      
      columns.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
    
    // If no fields to update, return current patient
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
   * List all patients
   * @param {Object} filters - Optional filter parameters
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of patients
   */
  async findAll(filters = {}, limit = 100, offset = 0) {
    // Start building the query
    let query = `
      SELECT p.*, 
             u.first_name AS provider_first_name, 
             u.last_name AS provider_last_name
      FROM patients p
      LEFT JOIN users u ON p.primary_provider_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add filters
    if (filters.risk_level) {
      query += ` AND p.risk_level = $${paramCount++}`;
      queryParams.push(filters.risk_level);
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
    
    if (filters.provider_id) {
      query += ` AND p.primary_provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    // Add sorting
    query += ' ORDER BY p.last_name, p.first_name';
    
    // Add pagination
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  },

  /**
   * Count total patients with filters
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise<number>} Patient count
   */
  async count(filters = {}) {
    // Start building the query
    let query = `
      SELECT COUNT(*) 
      FROM patients p
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Add filters
    if (filters.risk_level) {
      query += ` AND p.risk_level = $${paramCount++}`;
      queryParams.push(filters.risk_level);
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
    
    if (filters.provider_id) {
      query += ` AND p.primary_provider_id = $${paramCount++}`;
      queryParams.push(filters.provider_id);
    }
    
    const result = await pool.query(query, queryParams);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete patient by ID
   * @param {string} id - Patient UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const query = 'DELETE FROM patients WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  },
  
  /**
   * Get count of patients by risk level
   * @returns {Promise<Object>} Counts by risk level
   */
  async countByRiskLevel() {
    const query = `
      SELECT risk_level, COUNT(*) AS count
      FROM patients
      GROUP BY risk_level
    `;
    
    const result = await pool.query(query);
    
    // Format the result
    const riskLevelCounts = {
      low: 0,
      medium: 0,
      high: 0,
      total: 0
    };
    
    result.rows.forEach(row => {
      riskLevelCounts[row.risk_level] = parseInt(row.count, 10);
      riskLevelCounts.total += parseInt(row.count, 10);
    });
    
    return riskLevelCounts;
  },
  
  /**
   * Calculate risk level and update patient
   * @param {string} id - Patient UUID
   * @returns {Promise<Object>} Updated patient data with new risk assessment
   */
  async calculateRisk(id) {
    // First get the patient
    const patient = await this.findById(id);
    if (!patient) return null;
    
    // Prepare risk factors array
    const riskFactors = [];
    if (patient.family_history_diabetes) riskFactors.push('Family history of diabetes');
    if (patient.previous_gdm) riskFactors.push('Previous GDM');
    if (patient.previous_macrosomia) riskFactors.push('Previous macrosomia');
    if (patient.bmi && patient.bmi >= 30) riskFactors.push('BMI ≥ 30');
    
    // Calculate age from date of birth
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age >= 35) riskFactors.push('Age ≥ 35');
    
    // Calculate risk level based on risk factors
    let riskLevel = 'low';
    if (riskFactors.length >= 3 || patient.previous_gdm) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }
    
    // Update the patient with new risk assessment
    const query = `
      UPDATE patients
      SET risk_level = $1, risk_factors = $2, risk_score = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [
      riskLevel,
      riskFactors,
      riskFactors.length,
      id
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
};

module.exports = patientModel;