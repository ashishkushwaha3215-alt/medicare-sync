
const express = require('express');
const { body, param } = require('express-validator');

const validate = require('../middlewares/validate.middleware');

const {
  protect,
  restrictTo,
} = require('../middlewares/auth.middleware');

const {
  getBookedSlots,
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  addPrescription,
  getPatientHistory,
} = require('../controllers/appointment.controller');

const router = express.Router();

// Public route
router.get('/booked-slots', getBookedSlots);

// Authentication required for routes below
router.use(protect);

// Book appointment
router.post(
  '/',
  restrictTo('patient'),
  [
    body('doctorId')
      .isMongoId()
      .withMessage('Valid doctorId required'),

    body('appointmentDate')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Appointment date must be in YYYY-MM-DD format'),

    body('timeSlot')
      .trim()
      .notEmpty()
      .withMessage('Time slot is required'),

    body('symptoms')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Symptoms cannot exceed 500 characters'),
  ],
  validate,
  bookAppointment
);

// Patient appointments
router.get('/my', restrictTo('patient'), getMyAppointments);

// Patient history (Doctor/Admin)
router.get(
  '/patient/:patientId/history',
  restrictTo('doctor', 'admin'),
  [
    param('patientId')
      .isMongoId()
      .withMessage('Invalid patient ID'),
  ],
  validate,
  getPatientHistory
);

// Update appointment status
router.patch(
  '/:id/status',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid appointment ID'),

    body('status')
      .isIn(['confirmed', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateAppointmentStatus
);

// Add prescription (Doctor only)
router.put(
  '/:id/prescription',
  restrictTo('doctor'),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid appointment ID'),

    body('diagnosis')
      .trim()
      .notEmpty()
      .withMessage('Diagnosis is required'),
  ],
  validate,
  addPrescription
);

module.exports = router;
