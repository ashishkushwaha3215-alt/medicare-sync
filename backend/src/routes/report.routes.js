
const express = require('express');
const { param, body } = require('express-validator');

const validate = require('../middlewares/validate.middleware');
const {
  uploadReport,
  getMyReports,
  downloadReport,
  deleteReport,
} = require('../controllers/report.controller');

const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(protect, restrictTo('patient'));

// Upload Medical Report
router.post(
  '/',
  upload.single('file'),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Report title is required')
      .isLength({ max: 100 })
      .withMessage('Title cannot exceed 100 characters'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Notes cannot exceed 300 characters'),
  ],
  validate,
  uploadReport
);

// Get Patient Reports
router.get('/my', getMyReports);

// Download Medical Report
router.get(
  '/:id/download',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid report ID'),
  ],
  validate,
  downloadReport
);

// Delete Medical Report
router.delete(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid report ID'),
  ],
  validate,
  deleteReport
);

module.exports = router;
