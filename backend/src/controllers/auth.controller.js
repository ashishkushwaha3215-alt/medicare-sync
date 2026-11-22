const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// @desc    Register new patient or doctor
// @route   POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, gender, specialization, experience, consultationFee } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const userRole = role === 'doctor' ? 'doctor' : 'patient';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    phone,
    gender,
  });

  // Agar user doctor ke roop mein register kar raha hai toh uska DoctorProfile bhi bana do
  if (userRole === 'doctor') {
    await DoctorProfile.create({
      user: user._id,
      specialization: specialization || 'General Physician',
      experience: experience || 1,
      consultationFee: consultationFee || 500,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: {
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// @desc    Login user & get JWT token
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact admin.');
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});