const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const logActivity = require('../utils/logActivity');

// GET /api/v1/admin/overview (Analytics + Department-wise Chart Data)
exports.getAdminOverview = async (req, res, next) => {
  try {
    const [totalPatients, totalDoctors, pendingDoctors, totalAppointments, byStatus, deptStats] =
      await Promise.all([
        User.countDocuments({ role: 'patient' }),
        Doctor.countDocuments({ isApproved: true }),
        Doctor.countDocuments({ isApproved: false }),
        Appointment.countDocuments(),
        Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Appointment.aggregate([
          {
            $lookup: {
              from: 'doctors',
              localField: 'doctor',
              foreignField: '_id',
              as: 'doctorDoc',
            },
          },
          { $unwind: '$doctorDoc' },
          {
            $group: {
              _id: '$doctorDoc.specialization',
              appointments: { $sum: 1 },
              revenue: { $sum: '$doctorDoc.consultationFee' },
            },
          },
          { $sort: { appointments: -1 } },
        ]),
      ]);

    const formattedDept = deptStats.map((d) => ({
      department: d._id || 'General',
      appointments: d.appointments,
      revenue: d.revenue,
    }));

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        byStatus,
        departmentAnalytics: formattedDept,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/patients
exports.getAllPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ role: 'patient' }).sort('-createdAt');
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete this user' });
    }
    await Doctor.deleteOne({ user: user._id });
    await user.deleteOne();

    await logActivity({
      user: req.user,
      action: 'USER_DELETED',
      details: `Admin removed user ${user.email}`,
    });

    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/appointments
exports.getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .sort('-createdAt');
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

// Departments CRUD
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort('name');
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description, headDoctor } = req.body;
    const dept = await Department.create({ name, description, headDoctor });

    await logActivity({
      user: req.user,
      action: 'DEPARTMENT_CREATED',
      details: `Created department: ${dept.name}`,
    });

    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Department already exists' });
    }
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    await logActivity({
      user: req.user,
      action: 'DEPARTMENT_DELETED',
      details: `Deleted department: ${dept.name}`,
    });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/logs
exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find().sort('-createdAt').limit(40);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};