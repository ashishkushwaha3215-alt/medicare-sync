
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      maxlength: 128,
      select: false,
    },

    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },

    age: {
      type: Number,
      min: 0,
      max: 130,
    },

    bloodGroup: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: '',
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
