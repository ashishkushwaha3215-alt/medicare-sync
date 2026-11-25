
const express = require('express');

const { protect } = require('../middlewares/auth.middleware');

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// All notification routes require login
router.use(protect);

// Get logged-in user's notifications
router.get('/', getMyNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Mark one notification as read
router.patch('/:id/read', markAsRead);

// Delete one notification
router.delete('/:id', deleteNotification);

module.exports = router;
