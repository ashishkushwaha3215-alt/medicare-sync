const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getBookedSlots,
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  addPrescription,
  getPatientHistory,
} = require('../controllers/appointmentController');

const router = express.Router();

router.get('/booked-slots', getBookedSlots);

router.use(protect);

router.post(
  '/',
  authorize('patient'),
  [
    body('doctorId').isMongoId().withMessage('Valid doctorId required'),
    body('appointmentDate').notEmpty().withMessage('Appointment date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
  ],
  validate,
  bookAppointment
);

router.get('/my', getMyAppointments);
router.get('/patient/:patientId/history', authorize('doctor', 'admin'), getPatientHistory);

router.patch(
  '/:id/status',
  [body('status').isIn(['confirmed', 'completed', 'cancelled']).withMessage('Invalid status')],
  validate,
  updateAppointmentStatus
);

router.put(
  '/:id/prescription',
  authorize('doctor'),
  [body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required')],
  validate,
  addPrescription
);

module.exports = router;