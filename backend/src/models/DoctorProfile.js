
const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // Doctor's profile image URL
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },

    experience: {
      type: Number,
      required: [true, 'Experience in years is required'],
      min: 0,
      max: 70,
    },

    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0,
      max: 1000000,
    },

    availableDays: {
      type: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      }],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },

    timeSlots: {
      type: [{
        type: String,
        trim: true,
        required: true,
      }],
      default: [
        '10:00 AM',
        '10:30 AM',
        '11:00 AM',
        '05:00 PM',
        '05:30 PM',
      ],
      validate: {
        validator: (slots) =>
          slots.every((slot) => slot.length > 0) &&
          new Set(slots).size === slots.length,
        message: 'Time slots must be non-empty and unique',
      },
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ specialization: 'text' });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
