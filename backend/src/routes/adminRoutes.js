const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminOverview,
  getAllPatients,
  deleteUser,
  getAllAppointments,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getActivityLogs,
} = require('../controllers/adminController');

const router = express.Router();

// Public list of departments (dropdowns ke liye)
router.get('/departments', getDepartments);

// Protected Admin-only routes
router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/patients', getAllPatients);
router.delete('/users/:id', deleteUser);
router.get('/appointments', getAllAppointments);
router.post('/departments', createDepartment);
router.delete('/departments/:id', deleteDepartment);
router.get('/logs', getActivityLogs);

module.exports = router;