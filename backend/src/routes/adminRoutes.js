
const express = require('express');
const { body, param } = require('express-validator');

const validate = require('../middlewares/validate.middleware');

const {
  protect,
  restrictTo,
} = require('../middlewares/auth.middleware');

const {
  getAdminOverview,
  getAllPatients,
  getAllUsers,
  updateUserDetails,
  updateUserStatus,
  bulkUpdateUserStatus,
  deleteUser,
  getAllAppointments,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getActivityLogs,
} = require('../controllers/adminController');

const router = express.Router();

// Authentication and Admin Authorization
router.use(protect, restrictTo('admin'));

// Dashboard Analytics
router.get('/overview', getAdminOverview);

// Patient Management
router.get('/patients', getAllPatients);

// User Management
router.get('/users', getAllUsers);

// Bulk Update User Status
router.patch(
  '/users/bulk-status',
  [
    body('userIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('Select between 1 and 100 users'),

    body('userIds.*')
      .isMongoId()
      .withMessage('Invalid user ID'),

    body('isActive')
      .isBoolean()
      .withMessage('isActive must be true or false')
      .toBoolean(),
  ],
  validate,
  bulkUpdateUserStatus
);

// Update User Details
router.patch(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  updateUserDetails
);

// Update User Status
router.patch(
  '/users/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be true or false')
      .toBoolean(),
  ],
  validate,
  updateUserStatus
);

// Delete User
router.delete(
  '/users/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  deleteUser
);

// Appointment Management
router.get('/appointments', getAllAppointments);

// Department Management
router.get('/departments', getDepartments);

router.post(
  '/departments',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),
  ],
  validate,
  createDepartment
);

router.delete(
  '/departments/:id',
  [param('id').isMongoId().withMessage('Invalid department ID')],
  validate,
  deleteDepartment
);

// Activity Logs
router.get('/logs', getActivityLogs);

module.exports = router;
