const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all approved doctors (with search, filter, sort, pagination)
// @route   GET /api/v1/doctors
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    specialization,
    sort = '-createdAt',
  } = req.query;

  const filter = { isApproved: true };

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' };
  }

  // Agar doctor ke naam se search kiya gaya hai
  if (search) {
    const matchingUsers = await User.find({
      role: 'doctor',
      name: { $regex: search, $options: 'i' },
    }).select('_id');

    const userIds = matchingUsers.map((u) => u._id);
    filter.$or = [
      { user: { $in: userIds } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [doctors, total] = await Promise.all([
    DoctorProfile.find(filter)
      .populate('user', 'name email phone avatar')
      .sort(sort.split(',').join(' '))
      .skip(skip)
      .limit(Number(limit)),
    DoctorProfile.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: doctors,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get single doctor details by DoctorProfile ID
// @route   GET /api/v1/doctors/:id
exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findById(req.params.id).populate(
    'user',
    'name email phone avatar gender'
  );

  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  res.json({
    success: true,
    data: doctor,
  });
});

// @desc    Update logged-in doctor's own profile & slots
// @route   PUT /api/v1/doctors/profile/me
exports.updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findOne({ user: req.user._id });
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  const allowedFields = [
    'specialization',
    'experience',
    'consultationFee',
    'availableDays',
    'timeSlots',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      doctor[field] = req.body[field];
    }
  });

  await doctor.save();

  res.json({
    success: true,
    message: 'Doctor profile updated',
    data: doctor,
  });
});

// @desc    Admin: Get all doctors (approved + pending)
// @route   GET /api/v1/doctors/admin/all
exports.getAdminAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await DoctorProfile.find()
    .populate('user', 'name email phone isActive')
    .sort('-createdAt');

  res.json({
    success: true,
    data: doctors,
  });
});

// @desc    Admin: Approve or unapprove a doctor
// @route   PATCH /api/v1/doctors/admin/:id/approve
exports.toggleDoctorApproval = asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findById(req.params.id);
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  doctor.isApproved = !doctor.isApproved;
  await doctor.save();

  res.json({
    success: true,
    message: `Doctor ${doctor.isApproved ? 'approved' : 'unapproved'} successfully`,
    data: doctor,
  });
});