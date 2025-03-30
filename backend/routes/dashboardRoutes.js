const express = require('express');
const { protect } = require('../middleware/auth');
const patientModel = require('../models/patientModel');
const appointmentModel = require('../models/appointmentModel');
const glucoseReadingModel = require('../models/glucoseReadingModel');

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res, next) => {
  try {
    // Get patient counts by risk level
    const patientCounts = await patientModel.countByRiskLevel();
    
    // Get today's appointments count
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const appointmentsToday = await appointmentModel.countByDate(today);
    
    // Get recent alerts count (out of range glucose readings in last 7 days)
    const alertsCount = await glucoseReadingModel.countRecentOutOfRange(7);
    
    res.status(200).json({
      status: 'success',
      data: {
        patientCounts,
        appointmentsToday,
        alertsCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/glucose-trends
 * @desc    Get glucose trends data for dashboard charts
 * @access  Private
 */
router.get('/glucose-trends', protect, async (req, res, next) => {
  try {
    // Default to last 6 months if not specified
    const months = parseInt(req.query.months, 10) || 6;
    
    // Get monthly average glucose values
    const trends = await glucoseReadingModel.getMonthlyAverages(months);
    
    res.status(200).json({
      status: 'success',
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/upcoming-appointments
 * @desc    Get upcoming appointments for dashboard
 * @access  Private
 */
router.get('/upcoming-appointments', protect, async (req, res, next) => {
  try {
    // Default to next 7 days if not specified
    const days = parseInt(req.query.days, 10) || 7;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Get upcoming appointments
    const appointments = await appointmentModel.getUpcoming(days, limit);
    
    res.status(200).json({
      status: 'success',
      data: appointments
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get alerts for dashboard (out of range glucose, missed appointments, etc.)
 * @access  Private
 */
router.get('/alerts', protect, async (req, res, next) => {
  try {
    // Default to alerts from last 7 days if not specified
    const days = parseInt(req.query.days, 10) || 7;
    const limit = parseInt(req.query.limit, 10) || 5;
    
    // Get glucose reading alerts
    const glucoseAlerts = await glucoseReadingModel.getRecentOutOfRange(days, limit);
    
    // Get missed appointment alerts
    const missedAppointments = await appointmentModel.getRecentMissed(days, limit);
    
    // Combine and sort all alerts by date (newest first)
    const allAlerts = [
      ...glucoseAlerts.map(alert => ({
        type: 'glucose',
        id: alert.id,
        patient_id: alert.patient_id,
        patient_name: `${alert.patient_first_name} ${alert.patient_last_name}`,
        date: alert.reading_date,
        value: alert.glucose_value,
        reading_type: alert.reading_type,
        risk_level: alert.risk_level,
        message: `ระดับน้ำตาลสูงผิดปกติ (${alert.glucose_value} mg/dL)`
      })),
      ...missedAppointments.map(alert => ({
        type: 'appointment',
        id: alert.id,
        patient_id: alert.patient_id,
        patient_name: `${alert.patient_first_name} ${alert.patient_last_name}`,
        date: alert.appointment_date,
        risk_level: alert.risk_level,
        message: 'ไม่มาตามนัด'
      }))
    ];
    
    // Sort by date (newest first)
    allAlerts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limit to the specified number
    const limitedAlerts = allAlerts.slice(0, limit);
    
    res.status(200).json({
      status: 'success',
      data: limitedAlerts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/risk-distribution
 * @desc    Get risk distribution data for dashboard
 * @access  Private
 */
router.get('/risk-distribution', protect, async (req, res, next) => {
  try {
    const riskCounts = await patientModel.countByRiskLevel();
    
    res.status(200).json({
      status: 'success',
      data: riskCounts
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;