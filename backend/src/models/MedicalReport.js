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
      maxlength: 100,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);