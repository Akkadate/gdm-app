const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * User Model
 */
const userModel = {
  /**
   * Find user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object>} User data
   */
  async findById(id) {
    const query = `
      SELECT id, username, email, first_name, last_name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object>} User data including password hash
   */
  async findByUsername(username) {
    const query = `
      SELECT *
      FROM users
      WHERE username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  },

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object>} User data
   */
  async findByEmail(email) {
    const query = `
      SELECT id, username, email, first_name, last_name, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user data
   */
  async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const query = `
      INSERT INTO users (
        id, username, password, email, first_name, last_name, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, first_name, last_name, role, created_at, updated_at
    `;
    
    const values = [
      uuidv4(),
      userData.username,
      hashedPassword,
      userData.email,
      userData.first_name,
      userData.last_name,
      userData.role
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Update user
   * @param {string} id - User UUID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  async update(id, userData) {
    let query = `
      UPDATE users
      SET 
    `;
    
    const columns = [];
    const values = [];
    let paramCount = 1;
    
    // Only update provided fields
    if (userData.email) {
      columns.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    
    if (userData.first_name) {
      columns.push(`first_name = $${paramCount++}`);
      values.push(userData.first_name);
    }
    
    if (userData.last_name) {
      columns.push(`last_name = $${paramCount++}`);
      values.push(userData.last_name);
    }
    
    if (userData.role) {
      columns.push(`role = $${paramCount++}`);
      values.push(userData.role);
    }
    
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      columns.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    
    // No fields to update
    if (columns.length === 0) {
      return await this.findById(id);
    }
    
    query += columns.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING id, username, email, first_name, last_name, role, created_at, updated_at`;
    values.push(id);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * List all users
   * @param {number} limit - Max number of results
   * @param {number} offset - Result offset for pagination
   * @returns {Promise<Array>} List of users
   */
  async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT id, username, email, first_name, last_name, role, created_at, updated_at
      FROM users
      ORDER BY last_name, first_name
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  },

  /**
   * Count total users
   * @returns {Promise<number>} User count
   */
  async count() {
    const query = 'SELECT COUNT(*) FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Delete user by ID
   * @param {string} id - User UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  },

  /**
   * Check if password matches
   * @param {string} password - Plaintext password to check
   * @param {string} hashedPassword - Stored hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
};

module.exports = userModel;
