
const mongoose = require('mongoose');

const Appointment = require('../models/Appointment');
const Doctor = require('../models/DoctorProfile');
const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');

const sendEmail = require('../utils/sendEmail');
const logActivity = require('../utils/logActivity');
const createNotification = require('../utils/createNotification');

const isValidDate = (date) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

const getWeekDay = (date) => {
  const dayIndex = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
};

// Get booked slots for a doctor
exports.getBookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!mongoose.isValidObjectId(doctorId) || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Valid doctorId and date are required',
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isApproved: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Approved doctor not found',
      });
    }

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed', 'completed'] },
    }).select('timeSlot');

    res.json({
      success: true,
      data: appointments.map((appointment) => appointment.timeSlot),
    });
  } catch (err) {
    next(err);
  }
};

// Book appointment
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID',
      });
    }

    if (!isValidDate(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date',
      });
    }

    const doctor = await Doctor.findById(doctorId).populate(
      'user',
      'name email'
    );

    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Approved doctor not found',
      });
    }

    const selectedDay = getWeekDay(appointmentDate);

    if (!doctor.availableDays.includes(selectedDay)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${selectedDay}`,
      });
    }

    if (!doctor.timeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot for this doctor',
      });
    }

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed', 'completed'] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      symptoms: symptoms?.trim() || '',
    });

    await logActivity({
      user: req.user,
      action: 'APPOINTMENT_BOOKED',
      details: `${req.user.name} booked ${doctor.user?.name} on ${appointmentDate} (${timeSlot})`,
    });

    // Notify doctor about new appointment
    if (doctor.user?._id) {
      await createNotification({
        recipient: doctor.user._id,
        sender: req.user._id,
        title: 'New Appointment Booked',
        message: `${req.user.name} booked an appointment for ${appointmentDate} at ${timeSlot}.`,
        type: 'appointment_booked',
        relatedAppointment: appointment._id,
      });
    }

    if (req.user.email) {
      await sendEmail({
        to: req.user.email,
        subject: 'Appointment Booked — MediCare Sync',
        text: `Your appointment with ${doctor.user?.name} (${doctor.specialization}) is booked for ${appointmentDate} at ${timeSlot}.`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked. Please choose another.',
      });
    }

    next(err);
  }
};

// Get appointments for logged-in user
exports.getMyAppointments = async (req, res, next) => {
  try {
    const filter = {};

    const allowedStatuses = [
      'pending',
      'confirmed',
      'completed',
      'cancelled',
    ];

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment status filter',
        });
      }

      filter.status = req.query.status;
    }

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({
        user: req.user._id,
      });

      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        });
      }

      filter.doctor = doctorProfile._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone gender age bloodGroup')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .sort('-createdAt');

    res.json({
      success: true,
      data: appointments,
    });
  } catch (err) {
    next(err);
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status',
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email',
        },
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (
      appointment.status === 'cancelled' ||
      appointment.status === 'completed'
    ) {
      return res.status(400).json({
        success: false,
        message: 'This appointment can no longer be updated',
      });
    }

    if (appointment.status === status) {
      return res.status(400).json({
        success: false,
        message: 'Appointment already has this status',
      });
    }

    // Patient can only cancel their own appointment
    if (req.user.role === 'patient') {
      if (String(appointment.patient?._id) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Patients can only cancel appointments',
        });
      }
    }

    // Doctor can confirm pending or complete confirmed appointments
    else if (req.user.role === 'doctor') {
      if (
        String(appointment.doctor?.user?._id) !== String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized for this appointment',
        });
      }

      const validTransition =
        (appointment.status === 'pending' && status === 'confirmed') ||
        (appointment.status === 'confirmed' && status === 'completed');

      if (!validTransition) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment status transition',
        });
      }
    }

    // Admin can manage appointment status
    else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    appointment.status = status;
    await appointment.save();

    await logActivity({
      user: req.user,
      action: `APPOINTMENT_${status.toUpperCase()}`,
      details: `Appointment on ${appointment.appointmentDate} (${appointment.timeSlot}) marked ${status}`,
    });

    // Notification details
    const notificationDetails = {
      confirmed: {
        title: 'Appointment Confirmed',
        message: `Your appointment on ${appointment.appointmentDate} at ${appointment.timeSlot} has been confirmed.`,
        type: 'appointment_confirmed',
      },
      completed: {
        title: 'Appointment Completed',
        message: `Your appointment on ${appointment.appointmentDate} at ${appointment.timeSlot} has been completed.`,
        type: 'appointment_completed',
      },
      cancelled: {
        title: 'Appointment Cancelled',
        message: `The appointment with ${appointment.patient?.name} on ${appointment.appointmentDate} at ${appointment.timeSlot} has been cancelled.`,
        type: 'appointment_cancelled',
      },
    };

    // Patient cancellation -> notify doctor
    // Doctor/admin update -> notify patient
    const recipient =
      status === 'cancelled'
        ? appointment.doctor?.user?._id
        : appointment.patient?._id;

    if (recipient) {
      await createNotification({
        recipient,
        sender: req.user._id,
        ...notificationDetails[status],
        relatedAppointment: appointment._id,
      });
    }

    if (appointment.patient?.email) {
      await sendEmail({
        to: appointment.patient.email,
        subject: `Appointment ${status.toUpperCase()} — MediCare Sync`,
        text: `Hi ${appointment.patient.name}, your appointment on ${appointment.appointmentDate} (${appointment.timeSlot}) is now ${status}.`,
      });
    }

    res.json({
      success: true,
      message: 'Appointment status updated',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

// Add prescription
exports.addPrescription = async (req, res, next) => {
  try {
    const { diagnosis, medicines, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email',
        },
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (
      !appointment.doctor?.user ||
      String(appointment.doctor.user._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to prescribe for this appointment',
      });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Prescription can only be issued for confirmed appointments',
      });
    }

    if (appointment.prescription?.diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'A prescription has already been issued',
      });
    }

    if (typeof diagnosis !== 'string' || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis is required',
      });
    }

    if (medicines !== undefined && !Array.isArray(medicines)) {
      return res.status(400).json({
        success: false,
        message: 'Medicines must be an array',
      });
    }

    appointment.prescription = {
      diagnosis: diagnosis.trim(),
      medicines: medicines || [],
      notes: typeof notes === 'string' ? notes.trim() : '',
      prescribedAt: new Date(),
    };

    appointment.status = 'completed';

    await appointment.save();

    await logActivity({
      user: req.user,
      action: 'PRESCRIPTION_ISSUED',
      details: `Dr. ${req.user.name} prescribed for ${appointment.patient?.name}`,
    });

    // Notify patient about digital prescription
    if (appointment.patient?._id) {
      await createNotification({
        recipient: appointment.patient._id,
        sender: req.user._id,
        title: 'Digital Prescription Ready',
        message: `Dr. ${req.user.name} has issued your digital prescription for ${appointment.appointmentDate} at ${appointment.timeSlot}.`,
        type: 'appointment_completed',
        relatedAppointment: appointment._id,
      });
    }

    if (appointment.patient?.email) {
      await sendEmail({
        to: appointment.patient.email,
        subject: 'Digital Prescription Ready — MediCare Sync',
        text: `Hi ${appointment.patient.name}, Dr. ${req.user.name} has issued your digital prescription.`,
      });
    }

    res.json({
      success: true,
      message: 'Prescription issued successfully',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

// Get patient history (Doctor/Admin)
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID',
      });
    }

    const patient = await User.findById(patientId).select(
      'name email phone gender age bloodGroup address'
    );

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Doctor can only view history of their own active patients
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({
        user: req.user._id,
      });

      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found',
        });
      }

      const hasAppointment = await Appointment.exists({
        patient: patientId,
        doctor: doctorProfile._id,
        status: { $in: ['pending', 'confirmed', 'completed'] },
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this patient history',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const [pastAppointments, reports] = await Promise.all([
      Appointment.find({ patient: patientId })
        .populate({
          path: 'doctor',
          populate: {
            path: 'user',
            select: 'name',
          },
        })
        .sort('-appointmentDate'),

      MedicalReport.find({ patient: patientId }).sort('-createdAt'),
    ]);

    res.json({
      success: true,
      data: {
        patient,
        appointments: pastAppointments,
        reports,
      },
    });
  } catch (err) {
    next(err);
  }
};
