
const express = require('express');

const {
  getDashboardStats,
} = require('../controllers/dashboard.controller');

const {
  protect,
} = require('../middlewares/auth.middleware');

const router = express.Router();

// Dashboard statistics (Authenticated users)
router.get('/stats', protect, getDashboardStats);

module.exports = router;
