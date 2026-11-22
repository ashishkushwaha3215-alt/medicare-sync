require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const DoctorProfile = require('./src/models/DoctorProfile');
const Appointment = require('./src/models/Appointment');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Purana demo data clean karein
    await Appointment.deleteMany();
    await DoctorProfile.deleteMany();
    await User.deleteMany();

    // 1. Admin Account
    await User.create({
      name: 'Clinic Admin',
      email: 'admin@demo.com',
      password: 'Password123',
      role: 'admin',
      phone: '9876543210',
    });

    // 2. Demo Patient Account
    const patient = await User.create({
      name: 'Rohan Sharma',
      email: 'patient@demo.com',
      password: 'Password123',
      role: 'patient',
      phone: '9123456780',
      gender: 'male',
    });

    // 3. Demo Doctors Accounts
    const docUser1 = await User.create({
      name: 'Dr. Ananya Verma',
      email: 'doctor@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9988776655',
      gender: 'female',
    });

    const docProfile1 = await DoctorProfile.create({
      user: docUser1._id,
      specialization: 'Cardiologist',
      experience: 8,
      consultationFee: 700,
      availableDays: ['Mon', 'Wed', 'Fri'],
      timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '05:00 PM'],
      isApproved: true,
    });

    const docUser2 = await User.create({
      name: 'Dr. Vikram Singh',
      email: 'vikram@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9988776644',
      gender: 'male',
    });

    await DoctorProfile.create({
      user: docUser2._id,
      specialization: 'Dermatologist',
      experience: 5,
      consultationFee: 500,
      availableDays: ['Tue', 'Thu', 'Sat'],
      timeSlots: ['11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM'],
      isApproved: true,
    });

    const docUser3 = await User.create({
      name: 'Dr. Neha Kapoor',
      email: 'neha@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9988776633',
      gender: 'female',
    });

    await DoctorProfile.create({
      user: docUser3._id,
      specialization: 'General Physician',
      experience: 6,
      consultationFee: 400,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeSlots: ['09:30 AM', '10:00 AM', '06:00 PM'],
      isApproved: true,
    });

    // 4. Ek Sample Appointment
    await Appointment.create({
      patient: patient._id,
      doctor: docProfile1._id,
      appointmentDate: '2026-11-25',
      timeSlot: '10:00 AM',
      symptoms: 'Mild chest discomfort and fatigue',
      status: 'confirmed',
    });

    console.log('Demo Data Seeded Successfully!');
    console.log('Admin Login:   admin@demo.com / Password123');
    console.log('Doctor Login:  doctor@demo.com / Password123');
    console.log('Patient Login: patient@demo.com / Password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();