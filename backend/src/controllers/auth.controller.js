
const crypto = require('crypto');

const User = require('../models/User');
const Doctor = require('../models/DoctorProfile');

const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');

// @desc Register user
// @route POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  let user;

  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      specialization,
      experience,
      consultationFee,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Public registration cannot create admin accounts
    const allowedRole = role === 'doctor' ? 'doctor' : 'patient';

    const existing = await User.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: allowedRole,
      phone,
    });

    if (allowedRole === 'doctor') {
      try {
        await Doctor.create({
          user: user._id,
          specialization: specialization || 'General Physician',
          experience:
            experience !== undefined ? Number(experience) : 1,
          consultationFee:
            consultationFee !== undefined
              ? Number(consultationFee)
              : 500,
        });
      } catch (error) {
        // Cleanup user if doctor profile creation fails
        await User.findByIdAndDelete(user._id);
        throw error;
      }
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

    const token = generateToken(user._id);

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

// @desc Login user
// @route POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+password');

    if (
      !user ||
      user.isActive === false ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await logActivity({
      user,
      action: 'USER_LOGIN',
      details: `${user.email} logged in`,
    });

    const token = generateToken(user._id);

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

// @desc Get logged-in user
// @route GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// @desc Update user profile
// @route PUT /api/v1/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'phone',
      'gender',
      'age',
      'bloodGroup',
      'address',
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await logActivity({
      user,
      action: 'PROFILE_UPDATED',
      details: `${user.email} updated profile details`,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Forgot password
// @route POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message:
          'If an account exists, a password reset link will be sent.',
      });
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const clientUrl =
      process.env.CLIENT_URL || 'http://localhost:5173';

    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'MediCare Sync - Password Reset Request',
      text: `Reset your password using this link. It is valid for 15 minutes: ${resetUrl}`,
    });

    await logActivity({
      user,
      action: 'PASSWORD_RESET_REQUESTED',
      details: `Password reset requested for ${user.email}`,
    });

    const response = {
      success: true,
      message:
        'If an account exists, a password reset link will be sent.',
    };

    // Development-only convenience for local testing
    if (process.env.NODE_ENV !== 'production') {
      response.resetUrl = resetUrl;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

// @desc Reset password
// @route PUT /api/v1/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    await logActivity({
      user,
      action: 'PASSWORD_RESET_COMPLETED',
      details: `${user.email} reset their password`,
    });

    const newToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token: newToken,
    });
  } catch (err) {
    next(err);
  }
};
