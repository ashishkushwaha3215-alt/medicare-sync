
const fs = require('fs');
const path = require('path');

const MedicalReport = require('../models/MedicalReport');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const uploadDir = path.resolve(__dirname, '../../uploads');

// @desc Upload a medical report
// @route POST /api/v1/reports
exports.uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a valid JPG, PNG, or PDF file');
  }

  const title = req.body.title?.trim();

  if (!title) {
    throw new ApiError(400, 'Report title is required');
  }

  const report = await MedicalReport.create({
    patient: req.user._id,
    title,
    notes: req.body.notes || '',
    fileUrl: req.file.filename,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  const reportData = report.toObject();
  delete reportData.fileUrl;

  res.status(201).json({
    success: true,
    message: 'Medical report uploaded successfully',
    data: reportData,
  });
});

// @desc Get patient's medical reports
// @route GET /api/v1/reports/my
exports.getMyReports = asyncHandler(async (req, res) => {
  const reports = await MedicalReport.find({
    patient: req.user._id,
  })
    .select('-fileUrl')
    .sort('-createdAt');

  res.json({
    success: true,
    data: reports,
  });
});

// @desc Download a medical report
// @route GET /api/v1/reports/:id/download
exports.downloadReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id)
    .select('+fileUrl');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (!report.patient.equals(req.user._id)) {
    throw new ApiError(403, 'Not authorized to access this report');
  }

  const filename = path.basename(report.fileUrl);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Report file not found');
  }

  res.download(filePath, `${report.title}${path.extname(filename)}`);
});

// @desc Delete a medical report
// @route DELETE /api/v1/reports/:id
exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await MedicalReport.findById(req.params.id)
    .select('+fileUrl');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (!report.patient.equals(req.user._id)) {
    throw new ApiError(403, 'Not authorized to delete this report');
  }

  const filename = path.basename(report.fileUrl);
  const filePath = path.join(uploadDir, filename);

  await report.deleteOne();

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Report file deletion failed:', error.message);
    }
  }

  res.json({
    success: true,
    message: 'Report deleted successfully',
  });
});
