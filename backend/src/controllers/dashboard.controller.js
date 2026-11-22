const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get role-based dashboard statistics
// @route   GET /api/v1/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const [totalPatients, totalDoctors, pendingDoctors, totalAppointments, byStatus] =
      await Promise.all([
        User.countDocuments({ role: 'patient' }),
        DoctorProfile.countDocuments({ isApproved: true }),
        DoctorProfile.countDocuments({ isApproved: false }),
        Appointment.countDocuments(),
        Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
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

  if (req.user.role === 'doctor') {
    const docProfile = await DoctorProfile.findOne({ user: req.user._id });
    const byStatus = await Appointment.aggregate([
      { $match: { doctor: docProfile._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return res.json({
      success: true,
      data: { byStatus },
    });
  }

  // Patient stats
  const byStatus = await Appointment.aggregate([
    { $match: { patient: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: { byStatus },
  });
});