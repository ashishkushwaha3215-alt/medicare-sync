
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
    },

    appointmentDate: {
      type: String,
      required: [true, 'Appointment date is required'],
      validate: {
        validator: function (value) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

          const date = new Date(`${value}T00:00:00.000Z`);

          return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
        },
        message: 'Please provide a valid date in YYYY-MM-DD format',
      },
    },

    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
      maxlength: 50,
    },

    symptoms: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    prescription: {
      diagnosis: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
      },
      medicines: {
        type: [
          {
            type: String,
            trim: true,
            maxlength: 200,
          },
        ],
        default: [],
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
      },
      prescribedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Prevent duplicate active bookings for the same doctor and slot.
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'completed'] },
    },
  }
);

// Patient appointment lookup
appointmentSchema.index({ patient: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
