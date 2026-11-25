
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Get role-based dashboard statistics
// @route   GET /api/v1/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {

  // ADMIN DASHBOARD
  if (req.user.role === 'admin') {
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      byStatus,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      DoctorProfile.countDocuments({ isApproved: true }),
      DoctorProfile.countDocuments({ isApproved: false }),
      Appointment.countDocuments(),
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        byStatus,
      },
    });
  }

  // DOCTOR DASHBOARD
  if (req.user.role === 'doctor') {
    const docProfile = await DoctorProfile.findOne({
      user: req.user._id,
    });

    if (!docProfile) {
      throw new ApiError(404, 'Doctor profile not found');
    }

    const [
      totalAppointments,
      byStatus,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctor: docProfile._id,
      }),
      Appointment.aggregate([
        {
          $match: {
            doctor: docProfile._id,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalAppointments,
        byStatus,
      },
    });
  }

  // PATIENT DASHBOARD
  if (req.user.role === 'patient') {
    const [
      totalAppointments,
      byStatus,
    ] = await Promise.all([
      Appointment.countDocuments({
        patient: req.user._id,
      }),
      Appointment.aggregate([
        {
          $match: {
            patient: req.user._id,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalAppointments,
        byStatus,
      },
    });
  }

  throw new ApiError(403, 'Dashboard access denied');
});
