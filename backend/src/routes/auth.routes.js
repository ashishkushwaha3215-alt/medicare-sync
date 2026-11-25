
const express = require('express');
const { body, param } = require('express-validator');

const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');

const {
  registerRules,
  loginRules,
} = require('../validators/auth.validator');

const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

const router = express.Router();

// Register
router.post('/register', registerRules, validate, register);

// Login
router.post('/login', loginRules, validate, login);

// Current logged-in user
router.get('/me', protect, getMe);

// Update profile
router.put('/profile', protect, updateProfile);

// Forgot password
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
  ],
  validate,
  forgotPassword
);

// Reset password
router.put(
  '/reset-password/:token',
  [
    param('token')
      .notEmpty()
      .withMessage('Reset token is required'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

module.exports = router;
