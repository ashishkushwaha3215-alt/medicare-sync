
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  CalendarCheck,
  ShieldCheck,
  Clock,
  UserCheck,
  Stethoscope,
  FileHeart,
  Building2,
  ArrowRight,
  HeartPulse,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Users,
  Star,
  MapPin,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Orthopedic',
];

const DOCTOR_PHOTOS = {
  // Named doctors always keep their own image, regardless of list order.
  'dr. vikram mehta':
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'dr. priya nair':
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'dr. ananya verma': '/images/ananya-verma-doctor.png',
};

const SPECIALTY_PHOTOS = {
  dermatologist:
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'general physician':
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  cardiologist: '/images/ananya-verma-doctor.png',
};

const getDoctorName = (doctor) =>
  String(doctor?.user?.name || doctor?.name || '').trim();

const getDoctorPhoto = (doctor) => {
  const name = getDoctorName(doctor).toLowerCase();

  // These seeded demo doctors always use their fixed named image mapping.
  // This takes priority over stale/misassigned profileImage values in MongoDB.
  if (DOCTOR_PHOTOS[name]) {
    return DOCTOR_PHOTOS[name];
  }

  // Other doctors can use their own uploaded profile image.
  if (doctor?.profileImage && doctor.profileImage.trim()) {
    return doctor.profileImage;
  }

  // Stable specialization fallback; never use the card index.
  const specialty = String(doctor?.specialization || '')
    .trim()
    .toLowerCase();

  if (SPECIALTY_PHOTOS[specialty]) {
    return SPECIALTY_PHOTOS[specialty];
  }

  const stableKey = String(doctor?._id || name || specialty || 'doctor');
  const hash = [...stableKey].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  const fallbackPhotos = Object.values(SPECIALTY_PHOTOS);
  return fallbackPhotos[hash % fallbackPhotos.length];
};

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Easy Appointment Booking',
    description:
      'Book appointments with verified doctors in just a few simple steps.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Specialists',
    description:
      'Connect with approved healthcare professionals across specialties.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description:
      'Find available consultation slots that fit your schedule.',
  },
  {
    icon: FileHeart,
    title: 'Health Management',
    description:
      'Keep your appointments and healthcare journey organized.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [quickSpec, setQuickSpec] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchFeaturedDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setDoctorError('');

        const response = await api.get('/doctors', {
          params: {
            page: 1,
            limit: 3,
            sort: '-createdAt',
          },
        });

        console.log('Home Doctors API Response:', response.data);

        const responseData = response.data?.data;

        const doctorList = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.doctors)
            ? responseData.doctors
            : [];

        if (active) {
          setFeaturedDoctors(doctorList);
        }
      } catch (error) {
        console.error('Home Doctors API Error:', error);

        if (active) {
          setDoctorError(
            error.response?.data?.message ||
              error.message ||
              'Unable to load doctors.'
          );
          setFeaturedDoctors([]);
        }
      } finally {
        if (active) {
          setLoadingDoctors(false);
        }
      }
    };

    fetchFeaturedDoctors();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (quickSpec) {
      params.set('specialization', quickSpec);
    }

    navigate(`/doctors?${params.toString()}`);
  };

  const handleBookAppointment = (doctorId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    navigate(`/doctors/${doctorId}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-blue-900 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-white/10 px-4 py-2 text-sm text-sky-100">
              <Sparkles size={16} />
              Your Health, Our Priority
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Healthcare Made
              <span className="block text-sky-400">
                Simple & Smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
              Connect with verified healthcare professionals, book
              appointments and manage your healthcare journey with
              MediCare Sync.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-400"
              >
                Find a Doctor
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/register"
                className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/20"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-7 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                Verified Doctors
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                Easy Booking
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-6">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=85"
                alt="Healthcare professional"
                className="h-72 w-full rounded-2xl object-cover md:h-96"
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <HeartPulse className="mb-2 text-sky-400" size={25} />
                  <p className="font-bold">Better Healthcare</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Care made convenient
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <CalendarCheck className="mb-2 text-emerald-400" size={25} />
                  <p className="font-bold">Quick Booking</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Simple appointment process
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl bg-white p-4 text-slate-800 shadow-xl sm:flex">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <ShieldCheck size={25} />
              </div>
              <div>
                <p className="font-bold">Trusted Healthcare</p>
                <p className="text-xs text-slate-500">
                  Verified professionals
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK SEARCH */}
      <section className="relative z-10 mx-auto -mt-8 max-w-5xl px-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl md:p-7">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Find the Right Doctor
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a specialty to explore available doctors.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Stethoscope
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600"
              />

              <select
                value={quickSpec}
                onChange={(e) => setQuickSpec(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">All Specializations</option>
                {SPECIALTIES.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-8 py-4 font-bold text-white transition hover:bg-sky-700"
            >
              <Search size={19} />
              Search Doctors
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            {
              icon: Users,
              number: 'Verified',
              label: 'Healthcare Professionals',
            },
            {
              icon: Building2,
              number: 'Multiple',
              label: 'Medical Specialties',
            },
            {
              icon: CalendarDays,
              number: 'Easy',
              label: 'Appointment Booking',
            },
            {
              icon: ShieldCheck,
              number: 'Secure',
              label: 'Patient Experience',
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-sky-50 p-3 text-sky-600">
                  <Icon size={23} />
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900">
                  {stat.number}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Why MediCare Sync
            </span>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
              Healthcare That Works for You
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              A convenient way to connect with healthcare professionals
              and manage appointments.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-7 transition hover:-translate-y-2 hover:border-sky-200 hover:bg-white hover:shadow-xl"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-sky-100 p-4 text-sky-700">
                    <Icon size={27} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED DOCTORS */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">

          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Meet Our Specialists
              </span>

              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                Featured Doctors
              </h2>

              <p className="mt-3 text-slate-500">
                Explore healthcare professionals available on our platform.
              </p>
            </div>

            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 font-bold text-sky-700 transition hover:text-sky-900"
            >
              View All Doctors
              <ChevronRight size={19} />
            </Link>
          </div>

          {loadingDoctors ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white"
                >
                  <div className="h-56 bg-slate-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="h-4 w-1/2 rounded bg-slate-200" />
                    <div className="h-10 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : doctorError ? (
            <div className="rounded-2xl border border-red-100 bg-white px-5 py-12 text-center">
              <Activity className="mx-auto mb-4 text-red-400" size={35} />

              <h3 className="text-xl font-bold text-slate-900">
                Unable to Load Doctors
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                {doctorError}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </div>
          ) : featuredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white py-14 text-center">
              <Stethoscope
                size={38}
                className="mx-auto mb-4 text-slate-300"
              />

              <h3 className="text-xl font-bold text-slate-800">
                No Featured Doctors Available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Please check again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredDoctors.map((doctor, idx) => (
                <div
                  key={doctor._id}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-100">
                    <img
                      src={getDoctorPhoto(doctor)}
                      alt={getDoctorName(doctor) || 'Doctor'}
                      onError={(e) => {
                        const image = e.currentTarget;

                        // Retry only once with the stable fallback image.
                        if (image.dataset.fallbackApplied === 'true') {
                          image.style.visibility = 'hidden';
                          return;
                        }

                        image.dataset.fallbackApplied = 'true';
                        const specialty = String(doctor?.specialization || '')
                          .trim()
                          .toLowerCase();
                        image.src =
                          SPECIALTY_PHOTOS[specialty] ||
                          SPECIALTY_PHOTOS['general physician'];
                      }}
                      className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${getDoctorName(doctor).toLowerCase() === 'dr. ananya verma' ? 'object-top' : 'object-center'}`}
                    />

                    <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow">
                      <CheckCircle2 size={14} />
                      Verified
                    </div>

                    <div className="absolute bottom-4 right-4 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-sky-700 shadow-lg">
                      ₹{doctor.consultationFee ?? 'N/A'}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900">
                          {doctor.user?.name || 'Doctor'}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-sky-600">
                          {doctor.specialization || 'Medical Specialist'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-50 p-2 text-amber-500">
                        <Star size={19} fill="currentColor" />
                      </div>
                    </div>

                    <div className="mb-5 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <UserCheck size={17} className="text-sky-600" />
                        {doctor.experience ?? 0} Years Experience
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-sky-600" />
                        {Array.isArray(doctor.availableDays) &&
                        doctor.availableDays.length > 0
                          ? doctor.availableDays.join(', ')
                          : 'Availability not specified'}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin size={17} className="text-sky-600" />
                        Available for Consultation
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookAppointment(doctor._id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 font-bold text-white transition hover:bg-sky-700"
                    >
                      Book Appointment
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-r from-sky-700 to-blue-900 py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 text-center md:flex-row md:px-8 md:text-left">
          <div>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Take the First Step Towards Better Health
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-sky-100">
              Discover specialists and manage your healthcare appointments
              conveniently with MediCare Sync.
            </p>
          </div>

          <Link
            to="/doctors"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-7 py-4 font-extrabold text-sky-800 shadow-lg transition hover:bg-sky-50"
          >
            Explore Doctors
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

    </main>
  );
}
