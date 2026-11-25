
const User = require('../models/User');
const Doctor = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const MedicalReport = require('../models/MedicalReport');
const logActivity = require('../utils/logActivity');

// GET /api/v1/admin/overview
exports.getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      byStatus,
      specializationStats,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isApproved: true }),
      Doctor.countDocuments({ isApproved: false }),
      Appointment.countDocuments(),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $match: { status: 'completed' } },
        {
          $lookup: {
            from: 'doctorprofiles',
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

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        byStatus,
        specializationAnalytics: specializationStats.map((item) => ({
          specialization: item._id || 'General',
          appointments: item.appointments,
          revenue: item.revenue,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/patients
exports.getAllPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort('-createdAt');

    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {};

    if (['patient', 'doctor', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort('-createdAt')
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/users/:id
// Update user profile details
exports.updateUserDetails = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'email',
      'phone',
      'gender',
      'age',
      'bloodGroup',
      'address',
      'role',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update',
      });
    }

    if (updates.role && !['patient', 'doctor', 'admin'].includes(updates.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role',
      });
    }

    if (updates.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin role cannot be assigned through this form',
      });
    }

    if (updates.email) {
      updates.email = String(updates.email).trim().toLowerCase();
    }

    if (updates.name) {
      updates.name = String(updates.name).trim();
    }

    if (updates.phone !== undefined) {
      updates.phone = String(updates.phone).trim();
    }

    if (updates.gender !== undefined &&
        !['Male', 'Female', 'Other', ''].includes(updates.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    if (updates.bloodGroup !== undefined) {
      updates.bloodGroup = String(updates.bloodGroup).trim().toUpperCase();

      if (!['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(updates.bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blood group',
        });
      }
    }

    if (updates.age !== undefined) {
      if (updates.age === '' || updates.age === null) {
        delete updates.age;
      } else {
        updates.age = Number(updates.age);

        if (!Number.isInteger(updates.age) || updates.age < 0 || updates.age > 130) {
          return res.status(400).json({
            success: false,
            message: 'Age must be a whole number between 0 and 130',
          });
        }
      }
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be edited through this API',
      });
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email address is already registered',
        });
      }
    }

    const oldRole = user.role;

    Object.assign(user, updates);
    await user.save();

    await logActivity({
      user: req.user,
      action: 'USER_UPDATED',
      details: `Updated profile of ${user.email}`,
    });

    res.json({
      success: true,
      message: 'User details updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        bloodGroup: user.bloodGroup,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered',
      });
    }

    next(err);
  }
};

// PATCH /api/v1/admin/users/bulk-status
// Activate or deactivate multiple users
exports.bulkUpdateUserStatus = async (req, res, next) => {
  try {
    const { userIds, isActive } = req.body;

    // Validate user IDs
    if (
      !Array.isArray(userIds) ||
      userIds.length === 0 ||
      userIds.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Select between 1 and 100 users',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false',
      });
    }

    // Remove duplicate IDs
    const uniqueIds = [...new Set(userIds.map(String))];

    // Find selected users, excluding admin accounts
    const selectedUsers = await User.find({
      _id: { $in: uniqueIds },
      role: { $ne: 'admin' },
    }).select('_id name email isActive');

    if (selectedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No eligible users found',
      });
    }

    const selectedIds = selectedUsers.map((user) => user._id);

    // Update only eligible non-admin users
    const result = await User.updateMany(
      {
        _id: { $in: selectedIds },
        role: { $ne: 'admin' },
      },
      {
        $set: { isActive },
      }
    );

    const action = isActive ? 'ACTIVATED' : 'DEACTIVATED';

    // Record activity
    await logActivity({
      user: req.user,
      action: `USERS_BULK_${action}`,
      details: `${action} ${result.modifiedCount} user account(s)`,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} user(s) ${
        isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        skippedCount: uniqueIds.length - selectedUsers.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/users/:id/status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deactivated through this API',
      });
    }

    user.isActive = isActive;
    await user.save();

    await logActivity({
      user: req.user,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      details: `${isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete this user',
      });
    }

    await Promise.all([
      Doctor.deleteOne({ user: user._id }),
      Appointment.deleteMany({
        $or: [{ patient: user._id }],
      }),
      MedicalReport.deleteMany({ patient: user._id }),
    ]);

    await user.deleteOne();

    await logActivity({
      user: req.user,
      action: 'USER_DELETED',
      details: `Admin removed user ${user.email}`,
    });

    res.json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/appointments
exports.getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .sort('-createdAt');

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/departments
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort('name');
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/admin/departments
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description, headDoctor } = req.body;

    const dept = await Department.create({
      name,
      description,
      headDoctor,
    });

    await logActivity({
      user: req.user,
      action: 'DEPARTMENT_CREATED',
      details: `Created department: ${dept.name}`,
    });

    res.status(201).json({
      success: true,
      data: dept,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Department already exists',
      });
    }
    next(err);
  }
};

// DELETE /api/v1/admin/departments/:id
exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    await logActivity({
      user: req.user,
      action: 'DEPARTMENT_DELETED',
      details: `Deleted department: ${dept.name}`,
    });

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/logs
exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .sort('-createdAt')
      .limit(40);

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
