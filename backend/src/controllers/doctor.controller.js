
const Doctor = require('../models/DoctorProfile');
const logActivity = require('../utils/logActivity');

const allowedSorts = [
  'consultationFee',
  '-consultationFee',
  '-experience',
  '-createdAt',
];

exports.getDoctors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const skip = (page - 1) * limit;

    const filter = { isApproved: true };

    if (req.query.specialization?.trim()) {
      const specialization = req.query.specialization
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.specialization = {
        $regex: specialization,
        $options: 'i',
      };
    }

    const sort = allowedSorts.includes(req.query.sort)
      ? req.query.sort
      : '-createdAt';

    if (req.query.search?.trim()) {
      const searchTerm = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$or = [
        { specialization: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get approved doctor by ID
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isApproved: true,
    }).populate('user', 'name email phone');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

// Get logged-in doctor's profile
exports.getMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).populate('user', 'name email phone');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

// Update logged-in doctor's profile
exports.updateMyDoctorProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'specialization',
      'experience',
      'consultationFee',
      'availableDays',
      'timeSlots',
      'profileImage',
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.profileImage !== undefined &&
      typeof updates.profileImage !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Profile image must be a valid URL string',
      });
    }

    if (
      updates.profileImage &&
      !/^https?:\/\/\S+$/i.test(updates.profileImage)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid profile image URL',
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).populate('user', 'name email phone');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    await logActivity({
      user: req.user,
      action: 'DOCTOR_PROFILE_UPDATED',
      details: `Dr. ${req.user.name} updated doctor profile`,
    });

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

// Get all doctors for admin
exports.getAllDoctorsAdmin = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    next(err);
  }
};

// Toggle doctor approval
exports.toggleApproveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    doctor.isApproved = !doctor.isApproved;
    await doctor.save();

    await logActivity({
      user: req.user,
      action: doctor.isApproved ? 'DOCTOR_APPROVED' : 'DOCTOR_REVOKED',
      details: `${doctor.user?.name} (${doctor.specialization}) marked as ${
        doctor.isApproved ? 'Approved' : 'Pending'
      }`,
    });

    res.json({
      success: true,
      message: `Doctor ${doctor.isApproved ? 'approved' : 'revoked'}`,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};
