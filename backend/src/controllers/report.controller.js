const MedicalReport = require('../models/MedicalReport');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Upload a medical lab report (Patient only)
// @route   POST /api/v1/reports
exports.uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a valid JPG, PNG, or PDF file');
  }

  const { title, notes } = req.body;
  if (!title) {
    throw new ApiError(400, 'Report title is required');
  }

  const report = await MedicalReport.create({
    patient: req.user._id,
    title,
    notes: notes || '',
    fileUrl: `/uploads/${req.file.filename}`,
  });

  res.status(201).json({
    success: true,
    message: 'Medical report uploaded successfully',
    data: report,
  });
});

// @desc    Get patient's medical reports
// @route   GET /api/v1/reports/my
exports.getMyReports = asyncHandler(async (req, res) => {
  const reports = await MedicalReport.find({ patient: req.user._id }).sort('-createdAt');

  res.json({
    success: true,
    data: reports,
  });
});

// @desc    Delete a medical report (Owner only)
// @route   DELETE /api/v1/reports/:id
exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id);
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (!report.patient.equals(req.user._id)) {
    throw new ApiError(403, 'Not authorized to delete this report');
  }

  await report.deleteOne();

  res.json({
    success: true,
    message: 'Report deleted successfully',
  });
});