
const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
      select: false,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    fileType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'application/pdf'],
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 1,
      max: 2 * 1024 * 1024,
    },
  },
  { timestamps: true }
);

medicalReportSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
