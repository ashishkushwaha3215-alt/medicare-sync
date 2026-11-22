const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, specialization, experience, consultationFee } =
      req.body;

    const allowedRole = role === 'doctor' ? 'doctor' : 'patient';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      phone,
    });

    if (allowedRole === 'doctor') {
      await Doctor.create({
        user: user._id,
        specialization: specialization || 'General Physician',
        experience: Number(experience) || 1,
        consultationFee: Number(consultationFee) || 500,
      });
    }

    await logActivity({
      user,
      action: 'USER_REGISTERED',
      details: `New ${allowedRole} registered: ${user.email}`,
    });

    await sendEmail({
      to: user.email,
      subject: 'Welcome to MediCare Sync!',
      text: `Hi ${user.name}, your ${allowedRole} account has been created successfully.`,
    });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await logActivity({
      user,
      action: 'USER_LOGIN',
      details: `${user.email} logged in`,
    });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        bloodGroup: user.bloodGroup,
        address: user.address,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/v1/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, gender, age, bloodGroup, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, gender, age, bloodGroup, address },
      { new: true, runValidators: true }
    );

    await logActivity({
      user,
      action: 'PROFILE_UPDATED',
      details: `${user.email} updated profile details`,
    });

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'MediCare Sync — Password Reset Request',
      text: `Reset your password using this link (valid for 15 mins): ${resetUrl}`,
    });

    await logActivity({
      user,
      action: 'PASSWORD_RESET_REQUESTED',
      details: `Password reset token issued for ${user.email}`,
    });

    // Demo convenience: resetToken & resetUrl response mein bhi bhej rahe hain taaki bina SMTP ke test ho sake
    res.json({
      success: true,
      message: 'Password reset link generated! Check email or use the instant reset link below.',
      resetToken,
      resetUrl,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (!req.body.password || req.body.password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'New password must be at least 8 characters' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logActivity({
      user,
      action: 'PASSWORD_RESET_COMPLETED',
      details: `${user.email} reset their password`,
    });

    const token = signToken(user._id);
    res.json({ success: true, message: 'Password reset successful!', token });
  } catch (err) {
    next(err);
  }
};