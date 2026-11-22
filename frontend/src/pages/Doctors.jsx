import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DOCTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
];

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors', {
        params: { page, limit: 6, search, specialization, sort },
      });
      const list = res.data.data;
      setDoctors(list);
      setPages(res.data.pagination.pages || 1);

      // Agar Home page se "Book Time Slot" click karke aaye hain
      const bookId = searchParams.get('book');
      if (bookId) {
        const target = list.find((d) => d._id === bookId);
        if (target) {
          if (!user) {
            toast('Please login as a patient to complete booking', { icon: '🔐' });
            navigate('/login');
          } else if (user.role === 'patient') {
            setSelectedDoctor(target);
          }
        }
      }
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, specialization, sort]);

  useEffect(() => {
    if (!selectedDoctor || !date) return;
    api
      .get('/appointments/booked-slots', {
        params: { doctorId: selectedDoctor._id, date },
      })
      .then((res) => {
        setBookedSlots(res.data.data);
        setSelectedSlot('');
      })
      .catch(() => setBookedSlots([]));
  }, [selectedDoctor, date]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const openBooking = (doc) => {
    if (!user) {
      toast.error('Please login as a patient to book an appointment');
      navigate('/login');
      return;
    }
    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }
    setSelectedDoctor(doc);
    setSelectedSlot('');
    setSymptoms('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentDate: date,
        timeSlot: selectedSlot,
        symptoms,
      });
      toast.success('Appointment booked successfully!');
      setSelectedDoctor(null);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="container">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Find Verified Doctors</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Filter by specialty, compare experience &amp; consultation fees, and lock your slot
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.75rem',
        }}
      >
        <input
          type="text"
          placeholder="Search doctor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={specialization}
          onChange={(e) => {
            setPage(1);
            setSpecialization(e.target.value);
          }}
        >
          <option value="">All Specializations</option>
          <option value="Cardiologist">Cardiologist</option>
          <option value="Dermatologist">Dermatologist</option>
          <option value="General Physician">General Physician</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Newest First</option>
          <option value="consultationFee">Fee: Low to High</option>
          <option value="-consultationFee">Fee: High to Low</option>
          <option value="-experience">Most Experienced</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search Doctors
        </button>
      </form>

      {/* Doctors Grid with Photos */}
      {loading ? (
        <p>Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <div className="card">No approved doctors found matching your criteria.</div>
      ) : (
        <div className="grid-3">
          {doctors.map((doc, idx) => (
            <div key={doc._id} className="doctor-card">
              <div className="doctor-img-wrap">
                <img
                  src={DOCTOR_PHOTOS[idx % DOCTOR_PHOTOS.length]}
                  alt={doc.user?.name || 'Doctor'}
                />
                <span className="verified-pill">Verified</span>
                <span className="spec-pill">{doc.specialization}</span>
              </div>

              <div className="doctor-body">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{doc.user?.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
                  Experience: <strong>{doc.experience} yrs</strong> · Fee:{' '}
                  <strong>₹{doc.consultationFee}</strong>
                </p>
                <p style={{ color: '#64748b', fontSize: '0.83rem', marginTop: '0.35rem' }}>
                  Available: {doc.availableDays?.join(', ')}
                </p>

                <button
                  onClick={() => openBooking(doc)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.1rem' }}
                >
                  Select Date &amp; Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn btn-outline"
          >
            Prev
          </button>
          <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      )}

      {/* Booking Form Box */}
      {selectedDoctor && (
        <div className="card" style={{ marginTop: '2.25rem', border: '2px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Book Appointment with {selectedDoctor.user?.name}</h3>
              <p style={{ color: '#0284c7', fontSize: '0.9rem', fontWeight: 600 }}>
                {selectedDoctor.specialization} · Consultation Fee: ₹{selectedDoctor.consultationFee}
              </p>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="btn btn-outline">
              Close
            </button>
          </div>

          <form onSubmit={handleBook} style={{ marginTop: '1.25rem' }}>
            <div className="form-group" style={{ maxWidth: '260px' }}>
              <label>1. Choose Appointment Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>2. Select Available Time Slot (Disabled = Already Booked)</label>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {selectedDoctor.timeSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {slot} {isBooked ? '(Booked)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>3. Symptoms / Reason for Visit</label>
              <textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Briefly describe your symptoms..."
              />
            </div>

            <button type="submit" disabled={booking} className="btn btn-success">
              {booking ? 'Confirming...' : `Confirm Booking (₹${selectedDoctor.consultationFee})`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}