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
      type: String, // Format: "YYYY-MM-DD" (easy for date matching)
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
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
      diagnosis: { type: String, default: '' },
      medicines: { type: [String], default: [] },
      notes: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Fast querying & slot lookups ke liye compound index
appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patient: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);