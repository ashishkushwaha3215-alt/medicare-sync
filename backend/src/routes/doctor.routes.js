const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getAllDoctorsAdmin,
  toggleApproveDoctor,
} = require('../controllers/doctorController');

const router = express.Router();

// Public routes
router.get('/', getDoctors);

// Doctor self-management routes
router.get('/me/profile', protect, authorize('doctor'), getMyDoctorProfile);
router.put('/me/profile', protect, authorize('doctor'), updateMyDoctorProfile);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllDoctorsAdmin);
router.patch('/admin/:id/approve', protect, authorize('admin'), toggleApproveDoctor);

router.get('/:id', getDoctorById);

module.exports = router;