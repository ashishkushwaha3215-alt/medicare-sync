const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get booked slots for a doctor on a specific date
// @route   GET /api/v1/appointments/booked-slots?doctorId=...&date=YYYY-MM-DD
exports.getBookedSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    throw new ApiError(400, 'doctorId and date are required');
  }

  const booked = await Appointment.find({
    doctor: doctorId,
    appointmentDate: date,
    status: { $ne: 'cancelled' },
  }).select('timeSlot');

  res.json({
    success: true,
    data: booked.map((b) => b.timeSlot),
  });
});

// @desc    Book a new appointment (Patient only)
// @route   POST /api/v1/appointments
exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;

  const doctor = await DoctorProfile.findById(doctorId);
  if (!doctor || !doctor.isApproved) {
    throw new ApiError(404, 'Approved doctor not found');
  }

  // Double-booking check: kya ye slot pehle se booked hai?
  const alreadyBooked = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate,
    timeSlot,
    status: { $ne: 'cancelled' },
  });

  if (alreadyBooked) {
    throw new ApiError(409, 'This time slot is already booked. Please choose another.');
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate,
    timeSlot,
    symptoms,
  });

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: appointment,
  });
});

// @desc    Get logged-in user's appointments (Patient, Doctor, or Admin)
// @route   GET /api/v1/appointments/my
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = {};

  if (status) filter.status = status;

  if (req.user.role === 'patient') {
    filter.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    const docProfile = await DoctorProfile.findOne({ user: req.user._id });
    if (!docProfile) throw new ApiError(404, 'Doctor profile not found');
    filter.doctor = docProfile._id;
  }
  // Admin ke liye filter empty rahega, toh saari appointments dikhengi

  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name email phone gender')
      .populate({
        path: 'doctor',
        select: 'specialization consultationFee',
        populate: { path: 'user', select: 'name email phone' },
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: appointments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Update appointment status (Cancel by Patient, Confirm/Complete by Doctor)
// @route   PATCH /api/v1/appointments/:id/status
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('doctor');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Ownership & Role check
  if (req.user.role === 'patient') {
    if (!appointment.patient.equals(req.user._id)) {
      throw new ApiError(403, 'Not authorized to modify this appointment');
    }
    if (status !== 'cancelled') {
      throw new ApiError(403, 'Patients can only cancel appointments');
    }
  } else if (req.user.role === 'doctor') {
    if (!appointment.doctor.user.equals(req.user._id)) {
      throw new ApiError(403, 'Not authorized for this appointment');
    }
  }

  appointment.status = status;
  await appointment.save();

  res.json({
    success: true,
    message: `Appointment marked as ${status}`,
    data: appointment,
  });
});

// @desc    Add digital prescription (Doctor only)
// @route   PUT /api/v1/appointments/:id/prescription
exports.addPrescription = asyncHandler(async (req, res) => {
  const { diagnosis, medicines, notes } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('doctor');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (!appointment.doctor.user.equals(req.user._id)) {
    throw new ApiError(403, 'Not authorized to add prescription for this appointment');
  }

  appointment.prescription = {
    diagnosis: diagnosis || '',
    medicines: Array.isArray(medicines) ? medicines : [],
    notes: notes || '',
  };
  appointment.status = 'completed';
  await appointment.save();

  res.json({
    success: true,
    message: 'Prescription added and appointment completed',
    data: appointment,
  });
});