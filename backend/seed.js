require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Doctor = require('./src/models/DoctorProfile');
const Department = require('./src/models/Department');
const Appointment = require('./src/models/Appointment');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({}),
    ]);

    const admin = await User.create({
      name: 'Hospital Admin',
      email: 'admin@demo.com',
      password: 'Password123',
      role: 'admin',
      phone: '9876543210',
      gender: 'Male',
    });

    const patient = await User.create({
      name: 'Rohan Sharma',
      email: 'patient@demo.com',
      password: 'Password123',
      role: 'patient',
      phone: '9876501234',
      gender: 'Male',
      age: 28,
      bloodGroup: 'O+',
      address: 'Lucknow, UP',
    });

    const docUser1 = await User.create({
      name: 'Dr. Ananya Verma',
      email: 'doctor@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9811122233',
      gender: 'Female',
    });

    const docUser2 = await User.create({
      name: 'Dr. Vikram Mehta',
      email: 'vikram@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9822233344',
      gender: 'Male',
    });

    const docUser3 = await User.create({
      name: 'Dr. Priya Nair',
      email: 'priya@demo.com',
      password: 'Password123',
      role: 'doctor',
      phone: '9833344455',
      gender: 'Female',
    });

    const [doc1, doc2] = await Doctor.create([
      {
        user: docUser1._id,
        specialization: 'Cardiologist',
        experience: 12,
        consultationFee: 800,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM'],
        isApproved: true,
      },
      {
        user: docUser2._id,
        specialization: 'Dermatologist',
        experience: 8,
        consultationFee: 600,
        availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
        timeSlots: ['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM'],
        isApproved: true,
      },
      {
        user: docUser3._id,
        specialization: 'General Physician',
        experience: 10,
        consultationFee: 500,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
        isApproved: true,
      },
    ]);

    await Department.create([
      { name: 'Cardiology', headDoctor: 'Dr. Ananya Verma', description: 'Heart & vascular care' },
      { name: 'Dermatology', headDoctor: 'Dr. Vikram Mehta', description: 'Skin & hair treatments' },
      { name: 'General Medicine', headDoctor: 'Dr. Priya Nair', description: 'Primary healthcare & diagnostics' },
    ]);

    const today = new Date().toISOString().split('T')[0];
    await Appointment.create([
      {
        patient: patient._id,
        doctor: doc1._id,
        appointmentDate: today,
        timeSlot: '10:00 AM',
        symptoms: 'Mild chest discomfort and fatigue',
        status: 'completed',
        prescription: {
          diagnosis: 'Mild Hypertension & Stress',
          medicines: ['Telmisartan 20mg (1-0-0)', 'Vitamin D3 60k (Weekly)'],
          notes: 'Reduce salt intake, walk 30 mins daily, review after 15 days.',
          prescribedAt: new Date(),
        },
      },
      {
        patient: patient._id,
        doctor: doc2._id,
        appointmentDate: today,
        timeSlot: '02:00 PM',
        symptoms: 'Seasonal skin allergy',
        status: 'confirmed',
      },
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDatabase();
