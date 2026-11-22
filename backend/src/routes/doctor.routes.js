const router = require('express').Router();
const {
  getAllDoctors,
  getDoctorById,
  updateMyDoctorProfile,
  getAdminAllDoctors,
  toggleDoctorApproval,
} = require('../controllers/doctor.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Specific routes pehle
router.put('/profile/me', protect, restrictTo('doctor'), updateMyDoctorProfile);
router.get('/admin/all', protect, restrictTo('admin'), getAdminAllDoctors);
router.patch('/admin/:id/approve', protect, restrictTo('admin'), toggleDoctorApproval);

// Public & dynamic :id routes baad mein
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

module.exports = router;