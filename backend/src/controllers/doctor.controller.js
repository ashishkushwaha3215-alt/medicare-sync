const Doctor = require('../models/Doctor');
const logActivity = require('../utils/logActivity');

exports.getDoctors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const skip = (page - 1) * limit;

    const filter = { isApproved: true };
    if (req.query.specialization) {
      filter.specialization = { $regex: req.query.specialization, $options: 'i' };
    }

    const allowedSorts = ['consultationFee', '-consultationFee', '-experience', '-createdAt'];
    const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : '-createdAt';

    let query = Doctor.find(filter).populate('user', 'name email phone');

    if (req.query.search) {
      const all = await query.sort(sort);
      const term = req.query.search.toLowerCase();
      const filtered = all.filter(
        (d) =>
          d.user?.name?.toLowerCase().includes(term) ||
          d.specialization.toLowerCase().includes(term)
      );
      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);
      return res.json({
        success: true,
        data: paginated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    const [doctors, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit),
      Doctor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: doctors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/doctors/me/profile
exports.getMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/doctors/me/profile
exports.updateMyDoctorProfile = async (req, res, next) => {
  try {
    const { specialization, experience, consultationFee, availableDays, timeSlots } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { specialization, experience, consultationFee, availableDays, timeSlots },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    await logActivity({
      user: req.user,
      action: 'DOCTOR_AVAILABILITY_UPDATED',
      details: `Dr. ${req.user.name} updated availability & consultation settings`,
    });

    res.json({ success: true, message: 'Availability & profile updated!', data: doctor });
  } catch (err) {
    next(err);
  }
};

exports.getAllDoctorsAdmin = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate('user', 'name email phone').sort('-createdAt');
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

exports.toggleApproveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
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