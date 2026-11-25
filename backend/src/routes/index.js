
const router = require('express').Router();

// API Health Check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediCare Sync API v1 is running',
  });
});

// Authentication
router.use('/auth', require('./auth.routes'));

// Doctor Management
router.use('/doctors', require('./doctor.routes'));

// Appointment Management
router.use('/appointments', require('./appointment.routes'));

// Medical Reports
router.use('/reports', require('./report.routes'));

// Dashboard
router.use('/dashboard', require('./dashboard.routes'));

// Admin Management
router.use('/admin', require('./adminRoutes'));

// Notification Management
router.use('/notifications', require('./notification.routes'));

module.exports = router;
