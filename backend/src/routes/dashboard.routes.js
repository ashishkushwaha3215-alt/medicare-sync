const router = require('express').Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/stats', protect, getDashboardStats);

module.exports = router;