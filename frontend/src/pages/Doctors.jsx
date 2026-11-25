import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Stethoscope,
  Star,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  ShieldCheck,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DOCTOR_IMAGES = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=85',
  '/images/ananya-verma-doctor.png',
];

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

const getDoctorName = (doctor) =>
  doctor?.name ||
  doctor?.fullName ||
  doctor?.user?.name ||
  doctor?.doctorName ||
  'Medical Specialist';

const getDoctorSpecialization = (doctor) =>
  doctor?.specialization ||
  doctor?.department?.name ||
  doctor?.speciality ||
  'General Physician';

// Fixed mapping: does not change with filtering, sorting, or pagination.
const DOCTOR_NAME_IMAGES = {
  'dr. vikram mehta': DOCTOR_IMAGES[1],
  'dr. priya nair': DOCTOR_IMAGES[0],
  'dr. ananya verma': DOCTOR_IMAGES[2],
};

const SPECIALIZATION_IMAGES = {
  dermatologist: DOCTOR_IMAGES[1],
  'general physician': DOCTOR_IMAGES[0],
  cardiologist: DOCTOR_IMAGES[2],
};

const getFallbackDoctorImage = (doctor) => {
  const name = String(getDoctorName(doctor)).trim().toLowerCase();
  if (DOCTOR_NAME_IMAGES[name]) return DOCTOR_NAME_IMAGES[name];

  const specialization = String(getDoctorSpecialization(doctor))
    .trim()
    .toLowerCase();
  if (SPECIALIZATION_IMAGES[specialization]) {
    return SPECIALIZATION_IMAGES[specialization];
  }

  const stableValue = String(doctor?._id || name);
  const hash = [...stableValue].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return DOCTOR_IMAGES[hash % DOCTOR_IMAGES.length];
};

const getDoctorImage = (doctor) => {
  const name = String(getDoctorName(doctor)).trim().toLowerCase();

  // These three named doctors always use their assigned image.
  if (DOCTOR_NAME_IMAGES[name]) return DOCTOR_NAME_IMAGES[name];

  return (
    doctor?.profileImage ||
    doctor?.image ||
    doctor?.photo ||
    doctor?.avatar ||
    doctor?.user?.profileImage ||
    doctor?.user?.avatar ||
    getFallbackDoctorImage(doctor)
  );
};

const getToday = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
};

const styles = {
  page: {
    maxWidth: '1200px',
    width: 'calc(100% - 40px)',
    margin: '0 auto',
    padding: '42px 0 70px',
    minHeight: '75vh',
  },
  heading: {
    fontSize: 'clamp(28px, 4vw, 38px)',
    fontWeight: 800,
    color: '#102A43',
    margin: '0 0 8px',
    letterSpacing: '-1px',
  },
  subtitle: {
    color: '#64748B',
    fontSize: '15px',
    margin: 0,
    lineHeight: 1.7,
  },
  filterCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '18px',
    padding: '20px',
    marginTop: '28px',
    marginBottom: '30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '14px',
    alignItems: 'end',
    boxShadow: '0 5px 20px rgba(15, 23, 42, 0.04)',
  },
  field: {
    width: '100%',
    height: '46px',
    border: '1px solid #DCE5EC',
    borderRadius: '10px',
    padding: '0 13px',
    outline: 'none',
    color: '#334155',
    background: '#FFFFFF',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  primaryButton: {
    height: '46px',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '14px',
    padding: '0 20px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  // Fixed card width: a single filtered result will not stretch across the page.
  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(min(100%, 320px), 380px))',
    justifyContent: 'start',
    gap: '24px',
  },
  doctorCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 5px 20px rgba(15, 23, 42, 0.045)',
    minWidth: 0,
    maxWidth: '380px',
    width: '100%',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  // Keep a consistent image window without enlarging a single result.
  imageWrap: {
    height: '260px',
    width: '100%',
    overflow: 'hidden',
    background: '#F1F5F9',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // contain preserves the complete photo instead of cutting off the face/body.
  doctorImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center center',
    background: '#F1F5F9',
  },
  doctorBody: {
    padding: '20px',
  },
  name: {
    fontSize: '19px',
    fontWeight: 800,
    color: '#102A43',
    margin: '0 0 7px',
  },
  specialization: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#E6FFFB',
    color: '#0F766E',
    borderRadius: '30px',
    padding: '6px 11px',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '14px',
  },
  detail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748B',
    fontSize: '13px',
    margin: '9px 0',
  },
  bookButton: {
    width: '100%',
    height: '44px',
    border: 'none',
    borderRadius: '10px',
    background: '#0D9488',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState(
    searchParams.get('specialization') || ''
  );
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(getToday());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 6, sort };

        if (search.trim()) params.search = search.trim();
        if (specialization.trim()) {
          params.specialization = specialization.trim();
        }

        const response = await api.get('/doctors', { params });
        if (cancelled) return;

        const data = response.data?.data;
        const doctorList = Array.isArray(data)
          ? data
          : data?.doctors || response.data?.doctors || [];

        setDoctors(doctorList);
        setTotalDoctors(
          response.data?.pagination?.total ?? doctorList.length
        );
        setPages(
          response.data?.pagination?.pages ||
            data?.pagination?.pages ||
            response.data?.pages ||
            1
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Doctors fetch error:', error);
        toast.error(
          error.response?.data?.message || 'Unable to load doctors.'
        );
        setDoctors([]);
        setTotalDoctors(0);
        setPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDoctors();
    return () => {
      cancelled = true;
    };
  }, [page, search, specialization, sort]);

  useEffect(() => {
    const doctorId = searchParams.get('book');
    if (!doctorId || !doctors.length) return;

    const doctor = doctors.find(
      (item) => String(item._id) === String(doctorId)
    );
    if (doctor) openBooking(doctor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchBookedSlots = async () => {
      if (!selectedDoctor || !date) {
        setBookedSlots([]);
        return;
      }

      try {
        const response = await api.get('/appointments/booked-slots', {
          params: { doctorId: selectedDoctor._id, date },
        });
        if (cancelled) return;

        const result = response.data?.data;
        const slots = Array.isArray(result)
          ? result
          : result?.bookedSlots || response.data?.bookedSlots || [];
        setBookedSlots(slots);
        setSelectedSlot('');
      } catch (error) {
        if (cancelled) return;
        console.error('Booked slots error:', error);
        setBookedSlots([]);
      }
    };

    fetchBookedSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedDoctor, date]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSpecializationChange = (event) => {
    setPage(1);
    setSpecialization(event.target.value);
  };

  const handleSortChange = (event) => {
    setPage(1);
    setSort(event.target.value);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSpecialization('');
    setSort('-createdAt');
    setPage(1);
  };

  const openBooking = (doctor) => {
    if (!user) {
      toast.error('Please login to book an appointment.');
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments.');
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setSymptoms('');
    setDate(getToday());

    window.setTimeout(() => {
      document
        .getElementById('booking-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBooking = async (event) => {
    event.preventDefault();

    if (!selectedSlot) {
      toast.error('Please select an appointment time.');
      return;
    }

    try {
      setBooking(true);
      await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentDate: date,
        timeSlot: selectedSlot,
        symptoms,
      });

      toast.success('Appointment booked successfully!');
      setSelectedDoctor(null);
      setSelectedSlot('');
      setSymptoms('');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to book appointment. Please try again.'
      );
    } finally {
      setBooking(false);
    }
  };

  const isSlotBooked = (slot) =>
    bookedSlots.some((item) => {
      const bookedTime =
        typeof item === 'string' ? item : item?.timeSlot || item?.slot;
      return bookedTime === slot;
    });

  return (
    <main style={styles.page}>
      <div>
        <h1 style={styles.heading}>Find Your Doctor</h1>
        <p style={styles.subtitle}>
          Connect with experienced healthcare professionals and book your
          appointment with ease.
        </p>
      </div>

      <form onSubmit={handleSearch} style={styles.filterCard}>
        <div>
          <label
            htmlFor="doctor-search"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '8px',
            }}
          >
            Search Doctor
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '14px' }}
            />
            <input
              id="doctor-search"
              type="text"
              placeholder="Doctor name..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              style={{ ...styles.field, paddingLeft: '38px' }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="specialization"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '8px',
            }}
          >
            Specialization
          </label>
          <select
            id="specialization"
            name="specialization"
            value={specialization}
            onChange={handleSpecializationChange}
            style={styles.field}
          >
            <option value="">All Specializations</option>
            <option value="General Physician">General Physician</option>
            <option value="Cardiologist">Cardiologist</option>
            <option value="Dermatologist">Dermatologist</option>
            <option value="Neurologist">Neurologist</option>
            <option value="Orthopedic">Orthopedic</option>
            <option value="Pediatrician">Pediatrician</option>
            <option value="Gynecologist">Gynecologist</option>
            <option value="Dentist">Dentist</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="doctor-sort"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '8px',
            }}
          >
            Sort By
          </label>
          <select
            id="doctor-sort"
            value={sort}
            onChange={handleSortChange}
            style={styles.field}
          >
            <option value="-createdAt">Recently Added</option>
            <option value="consultationFee">Fee: Low to High</option>
            <option value="-consultationFee">Fee: High to Low</option>
            <option value="-experience">Experience: High to Low</option>
          </select>
        </div>

        <button
          type="submit"
          style={styles.primaryButton}
          disabled={loading}
        >
          <Search size={17} />
          Search
        </button>

        <button
          type="button"
          onClick={clearFilters}
          style={{
            ...styles.primaryButton,
            background: '#E2E8F0',
            color: '#334155',
          }}
        >
          <RefreshCw size={16} />
          Clear Filters
        </button>
      </form>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '20px',
            color: '#102A43',
            fontWeight: 800,
          }}
        >
          Available Doctors
        </h2>
        <span style={{ color: '#64748B', fontSize: '13px' }}>
          {totalDoctors} doctors found
        </span>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            color: '#0D9488',
          }}
        >
          <RefreshCw size={30} />
          <p style={{ color: '#64748B' }}>Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '55px 20px',
            textAlign: 'center',
          }}
        >
          <Stethoscope size={40} color="#94A3B8" />
          <h3 style={{ color: '#102A43', marginBottom: '8px' }}>
            No doctors found
          </h3>
          <p style={{ color: '#64748B', margin: 0 }}>
            Try changing your search or specialization filter.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {doctors.map((doctor) => {
            const doctorName = getDoctorName(doctor);
            const imageSrc = getDoctorImage(doctor);

            return (
              <article
                key={doctor._id}
                style={styles.doctorCard}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-4px)';
                  event.currentTarget.style.boxShadow =
                    '0 12px 28px rgba(15, 23, 42, 0.10)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.boxShadow =
                    '0 5px 20px rgba(15, 23, 42, 0.045)';
                }}
              >
                <div style={styles.imageWrap}>
                  <img
                    src={imageSrc}
                    alt={doctorName}
                    style={styles.doctorImage}
                    loading="lazy"
                    onError={(event) => {
                      const image = event.currentTarget;
                      const fallbackImage = getFallbackDoctorImage(doctor);

                      if (
                        !image.dataset.fallbackApplied &&
                        image.src !== new URL(fallbackImage, window.location.href).href
                      ) {
                        image.dataset.fallbackApplied = 'true';
                        image.src = fallbackImage;
                        return;
                      }

                      image.style.visibility = 'hidden';
                      image.parentElement.style.background =
                        'linear-gradient(135deg, #CCFBF1, #E0F2FE)';
                    }}
                  />

                  <span
                    style={{
                      position: 'absolute',
                      top: '13px',
                      right: '13px',
                      background: '#FFFFFF',
                      color: '#0F766E',
                      borderRadius: '30px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  >
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                </div>

                <div style={styles.doctorBody}>
                  <h3 style={styles.name}>{doctorName}</h3>
                  <span style={styles.specialization}>
                    <Stethoscope size={13} />
                    {getDoctorSpecialization(doctor)}
                  </span>

                  <div style={styles.detail}>
                    <UserRound size={16} />
                    <span>
                      {doctor.experience
                        ? `${doctor.experience} years experience`
                        : 'Experienced Professional'}
                    </span>
                  </div>

                  <div style={styles.detail}>
                    <MapPin size={16} />
                    <span>
                      {doctor.address ||
                        doctor.hospital ||
                        doctor.clinicName ||
                        'MediCare Sync Clinic'}
                    </span>
                  </div>

                  <div style={styles.detail}>
                    <Star size={16} color="#F59E0B" />
                    <span>
                      {doctor.rating
                        ? `${doctor.rating} Rating`
                        : 'New Doctor'}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #E2E8F0',
                      marginTop: '15px',
                      paddingTop: '14px',
                    }}
                  >
                    <span
                      style={{
                        color: '#94A3B8',
                        fontSize: '11px',
                        display: 'block',
                      }}
                    >
                      Consultation Fee
                    </span>
                    <strong style={{ color: '#102A43', fontSize: '18px' }}>
                      ₹{doctor.consultationFee ?? doctor.fees ?? '—'}
                    </strong>
                  </div>

                  <button
                    type="button"
                    style={styles.bookButton}
                    onClick={() => openBooking(doctor)}
                  >
                    Book Appointment
                    <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginTop: '35px',
          }}
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((previous) => previous - 1)}
            style={{
              ...styles.primaryButton,
              background: page <= 1 ? '#CBD5E1' : '#0D9488',
            }}
          >
            <ChevronLeft size={17} />
            Previous
          </button>
          <span style={{ color: '#475569', fontWeight: 700 }}>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((previous) => previous + 1)}
            style={{
              ...styles.primaryButton,
              background: page >= pages ? '#CBD5E1' : '#0D9488',
            }}
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {selectedDoctor && (
        <section
          id="booking-section"
          style={{
            marginTop: '50px',
            background: '#FFFFFF',
            border: '1px solid #DCE5EC',
            borderRadius: '20px',
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
            scrollMarginTop: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  color: '#102A43',
                  fontSize: '23px',
                  margin: '0 0 6px',
                  fontWeight: 800,
                }}
              >
                Book Appointment
              </h2>
              <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>
                With {getDoctorName(selectedDoctor)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDoctor(null)}
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '10px',
                padding: '9px',
                cursor: 'pointer',
                color: '#475569',
              }}
              aria-label="Close booking form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleBooking}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '18px',
              }}
            >
              <div>
                <label
                  htmlFor="appointment-date"
                  style={{
                    display: 'block',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  Appointment Date
                </label>
                <div style={{ position: 'relative' }}>
                  <CalendarDays
                    size={17}
                    color="#64748B"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '14px',
                    }}
                  />
                  <input
                    id="appointment-date"
                    type="date"
                    min={getToday()}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    style={{ ...styles.field, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="appointment-symptoms"
                  style={{
                    display: 'block',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  Symptoms / Reason
                </label>
                <input
                  id="appointment-symptoms"
                  type="text"
                  placeholder="Describe your concern"
                  value={symptoms}
                  onChange={(event) => setSymptoms(event.target.value)}
                  style={styles.field}
                />
              </div>
            </div>

            <h3
              style={{
                fontSize: '16px',
                color: '#102A43',
                margin: '25px 0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Clock size={18} />
              Select Time Slot
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
                gap: '10px',
              }}
            >
              {TIME_SLOTS.map((slot) => {
                const booked = isSlotBooked(slot);
                const selected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={booked}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      minHeight: '43px',
                      borderRadius: '9px',
                      border: selected
                        ? '2px solid #0D9488'
                        : '1px solid #DCE5EC',
                      background: booked
                        ? '#F1F5F9'
                        : selected
                          ? '#CCFBF1'
                          : '#FFFFFF',
                      color: booked
                        ? '#94A3B8'
                        : selected
                          ? '#0F766E'
                          : '#334155',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: booked ? 'not-allowed' : 'pointer',
                      textDecoration: booked ? 'line-through' : 'none',
                    }}
                  >
                    {slot}
                    {booked ? ' (Booked)' : ''}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={booking || !selectedSlot}
              style={{
                ...styles.primaryButton,
                width: '100%',
                marginTop: '25px',
                opacity: booking || !selectedSlot ? 0.6 : 1,
                cursor:
                  booking || !selectedSlot ? 'not-allowed' : 'pointer',
              }}
            >
              {booking ? 'Booking...' : 'Confirm Appointment'}
              {!booking && <ArrowRight size={17} />}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
