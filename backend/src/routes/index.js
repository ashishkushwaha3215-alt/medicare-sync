const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'MediCare Sync API v1 is running' });
});

router.use('/auth', require('./auth.routes'));
router.use('/doctors', require('./doctor.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/reports', require('./report.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;