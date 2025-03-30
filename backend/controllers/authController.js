const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * Authentication Controller
 */
const authController = {
  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide both username and password'
        });
      }

      // Find user by username
      const user = await userModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await userModel.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'gdmsecretkey',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Remove password from response
      const { password: _, ...userData } = user;

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        token,
        user: userData
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current logged in user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getMe(req, res, next) {
    try {
      const user = await userModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register new user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async register(req, res, next) {
    try {
      const { username, password, email, first_name, last_name, role } = req.body;

      // Validate required fields
      if (!username || !password || !email || !first_name || !last_name || !role) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields'
        });
      }

      // Check if username already exists
      const existingUsername = await userModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already exists'
        });
      }

      // Check if email already exists
      const existingEmail = await userModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already exists'
        });
      }

      // Create user
      const user = await userModel.create({
        username,
        password,
        email,
        first_name,
        last_name,
        role
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide both current and new password'
        });
      }

      // Find user
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Get full user with password
      const fullUser = await userModel.findByUsername(user.username);

      // Verify current password
      const isMatch = await userModel.comparePassword(currentPassword, fullUser.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const updatedUser = await userModel.update(req.user.id, {
        password: newPassword
      });

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
