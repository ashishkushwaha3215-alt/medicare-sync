const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'MediCare Sync API v1 is running' });
});

module.exports = router;