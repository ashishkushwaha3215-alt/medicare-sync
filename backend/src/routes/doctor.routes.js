
const express = require('express');
const { param } = require('express-validator');

const validate = require('../middlewares/validate.middleware');

const {
  protect,
  restrictTo,
} = require('../middlewares/auth.middleware');

const {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getAllDoctorsAdmin,
  toggleApproveDoctor,
} = require('../controllers/doctor.controller');

const router = express.Router();

// Public routes
router.get('/', getDoctors);

// Doctor self-management routes
router.get(
  '/me/profile',
  protect,
  restrictTo('doctor'),
  getMyDoctorProfile
);

router.put(
  '/me/profile',
  protect,
  restrictTo('doctor'),
  updateMyDoctorProfile
);

// Admin routes
router.get(
  '/admin/all',
  protect,
  restrictTo('admin'),
  getAllDoctorsAdmin
);

router.patch(
  '/admin/:id/approve',
  protect,
  restrictTo('admin'),
  [
    param('id').isMongoId().withMessage('Invalid doctor ID'),
  ],
  validate,
  toggleApproveDoctor
);

// Get doctor by ID
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid doctor ID'),
  ],
  validate,
  getDoctorById
);

module.exports = router;
