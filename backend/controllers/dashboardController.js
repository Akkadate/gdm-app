const patientModel = require('../models/patientModel');
const appointmentModel = require('../models/appointmentModel');
const glucoseReadingModel = require('../models/glucoseReadingModel');
const clinicalNoteModel = require('../models/clinicalNoteModel');

/**
 * Dashboard Controller
 */
const dashboardController = {
  /**
   * Get dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStats(req, res, next) {
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
  },

  /**
   * Get glucose trends data for dashboard charts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getGlucoseTrends(req, res, next) {
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
  },

  /**
   * Get upcoming appointments for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUpcomingAppointments(req, res, next) {
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
  },

  /**
   * Get alerts for dashboard (out of range glucose, missed appointments, etc.)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAlerts(req, res, next) {
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
  },

  /**
   * Get risk distribution data for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRiskDistribution(req, res, next) {
    try {
      const riskCounts = await patientModel.countByRiskLevel();
      
      res.status(200).json({
        status: 'success',
        data: riskCounts
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent activities for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRecentActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      
      // Get recent clinical notes
      const recentNotes = await clinicalNoteModel.getRecent(limit);
      
      // Get recent appointments (completed)
      const recentAppointments = await appointmentModel.getRecentCompleted(limit);
      
      // Get recent glucose readings
      const recentReadings = await glucoseReadingModel.getRecent(limit);
      
      // Combine and format activities
      const activities = [
        ...recentNotes.map(note => ({
          type: 'clinical_note',
          id: note.id,
          patient_id: note.patient_id,
          patient_name: `${note.patient_first_name} ${note.patient_last_name}`,
          date: note.note_date,
          time: note.created_at,
          user: `${note.provider_first_name} ${note.provider_last_name}`,
          details: 'บันทึกทางคลินิก'
        })),
        ...recentAppointments.map(appt => ({
          type: 'appointment',
          id: appt.id,
          patient_id: appt.patient_id,
          patient_name: `${appt.patient_first_name} ${appt.patient_last_name}`,
          date: appt.appointment_date,
          time: appt.appointment_time,
          user: `${appt.provider_first_name} ${appt.provider_last_name}`,
          details: `นัดหมาย ${appt.appointment_type}`
        })),
        ...recentReadings.map(reading => ({
          type: 'glucose_reading',
          id: reading.id,
          patient_id: reading.patient_id,
          patient_name: `${reading.patient_first_name} ${reading.patient_last_name}`,
          date: reading.reading_date,
          time: reading.reading_time,
          value: reading.glucose_value,
          details: `ค่าน้ำตาล ${reading.reading_type} ${reading.glucose_value} mg/dL`
        }))
      ];
      
      // Sort by date and time (newest first)
      activities.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
        return dateB - dateA;
      });
      
      // Limit to the specified number
      const limitedActivities = activities.slice(0, limit);
      
      res.status(200).json({
        status: 'success',
        data: limitedActivities
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get summary statistics for export
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getExportSummary(req, res, next) {
    try {
      // Get date range from query parameters
      const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
      
      // Get patient counts
      const patientCounts = await patientModel.countByRiskLevel();
      
      // Get appointment counts by status
      const appointmentStats = await appointmentModel.getStatsByDateRange(startDate, endDate);
      
      // Get glucose reading statistics
      const glucoseStats = await glucoseReadingModel.getStatsByDateRange(startDate, endDate);
      
      // Get clinical note counts
      const noteCount = await clinicalNoteModel.countByDateRange(startDate, endDate);
      
      res.status(200).json({
        status: 'success',
        data: {
          dateRange: {
            startDate,
            endDate
          },
          patients: patientCounts,
          appointments: appointmentStats,
          glucoseReadings: glucoseStats,
          clinicalNotes: {
            total: noteCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;