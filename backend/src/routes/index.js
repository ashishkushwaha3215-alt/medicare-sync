const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'MediCare Sync API v1 is running' });
});

router.use('/auth', require('./auth.routes'));
router.use('/doctors', require('./doctor.routes'));

module.exports = router;