const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');

exports.getBookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' });
    }

    const active = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    res.json({ success: true, data: active.map((a) => a.timeSlot) });
  } catch (err) {
    next(err);
  }
};

exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user', 'name email');
    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ success: false, message: 'Approved doctor not found' });
    }

    if (!doctor.timeSlots.includes(timeSlot)) {
      return res.status(400).json({ success: false, message: 'Invalid time slot for this doctor' });
    }

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another.',
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      symptoms,
    });

    await logActivity({
      user: req.user,
      action: 'APPOINTMENT_BOOKED',
      details: `${req.user.name} booked ${doctor.user?.name} on ${appointmentDate} (${timeSlot})`,
    });

    await sendEmail({
      to: req.user.email,
      subject: 'Appointment Booked — MediCare Sync',
      text: `Your appointment with ${doctor.user?.name} (${doctor.specialization}) is booked for ${appointmentDate} at ${timeSlot}.`,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slot was just booked by another user' });
    }
    next(err);
  }
};

exports.getMyAppointments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      filter.doctor = doctorProfile._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone gender age bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' },
      })
      .sort('-createdAt');

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'patient') {
      if (appointment.patient._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'Patients can only cancel' });
      }
    }

    appointment.status = status;
    await appointment.save();

    await logActivity({
      user: req.user,
      action: `APPOINTMENT_${status.toUpperCase()}`,
      details: `Appointment on ${appointment.appointmentDate} (${appointment.timeSlot}) marked ${status}`,
    });

    if (appointment.patient?.email) {
      await sendEmail({
        to: appointment.patient.email,
        subject: `Appointment ${status.toUpperCase()} — MediCare Sync`,
        text: `Hi ${appointment.patient.name}, your appointment on ${appointment.appointmentDate} (${appointment.timeSlot}) is now ${status}.`,
      });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.addPrescription = async (req, res, next) => {
  try {
    const { diagnosis, medicines, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.prescription = {
      diagnosis,
      medicines: Array.isArray(medicines) ? medicines : [],
      notes,
      prescribedAt: new Date(),
    };
    appointment.status = 'completed';
    await appointment.save();

    await logActivity({
      user: req.user,
      action: 'PRESCRIPTION_ISSUED',
      details: `Dr. ${req.user.name} prescribed for ${appointment.patient?.name} (${diagnosis})`,
    });

    if (appointment.patient?.email) {
      await sendEmail({
        to: appointment.patient.email,
        subject: 'Digital Prescription Ready — MediCare Sync',
        text: `Hi ${appointment.patient.name}, Dr. ${req.user.name} has uploaded your digital prescription for ${diagnosis}. View & download PDF on your dashboard.`,
      });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/appointments/patient/:patientId/history (Doctor/Admin view patient history & lab reports)
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const [patient, pastAppointments, reports] = await Promise.all([
      User.findById(patientId).select('name email phone gender age bloodGroup address'),
      Appointment.find({ patient: patientId })
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort('-appointmentDate'),
      MedicalReport.find({ patient: patientId }).sort('-createdAt'),
    ]);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      data: { patient, appointments: pastAppointments, reports },
    });
  } catch (err) {
    next(err);
  }
};