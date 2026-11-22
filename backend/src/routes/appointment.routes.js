const router = require('express').Router();
const {
  getBookedSlots,
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  addPrescription,
} = require('../controllers/appointment.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Public route: frontend par booked slots disable dikhane ke liye
router.get('/booked-slots', getBookedSlots);

// Protected routes (Login zaroori)
router.use(protect);

router.post('/', restrictTo('patient'), bookAppointment);
router.get('/my', getMyAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.put('/:id/prescription', restrictTo('doctor'), addPrescription);

module.exports = router;