import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Booking modal state
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
      setDoctors(res.data.data);
      setPages(res.data.pagination.pages || 1);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, specialization, sort]);

  // Jab doctor ya date select ho, tab us din ke already booked slots fetch karein
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
      <h2 style={{ marginBottom: '1rem' }}>Find Verified Doctors</h2>

      {/* Search, Filter & Sort Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          type="text"
          placeholder="Search by doctor name..."
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
          Search
        </button>
      </form>

      {/* Doctors List */}
      {loading ? (
        <p>Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <div className="card">No approved doctors found matching your criteria.</div>
      ) : (
        <div className="grid-3">
          {doctors.map((doc) => (
            <div key={doc._id} className="card">
              <h3 style={{ color: '#0f172a' }}>{doc.user?.name}</h3>
              <p style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.92rem' }}>
                {doc.specialization}
              </p>
              <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Experience: <strong>{doc.experience} yrs</strong> · Fee:{' '}
                <strong>₹{doc.consultationFee}</strong>
              </p>
              <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.35rem' }}>
                Days: {doc.availableDays?.join(', ')}
              </p>

              <button
                onClick={() => openBooking(doc)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Book Appointment
              </button>
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
        <div className="card" style={{ marginTop: '2rem', border: '2px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Book with {selectedDoctor.user?.name}</h3>
            <button onClick={() => setSelectedDoctor(null)} className="btn btn-outline">
              Close
            </button>
          </div>

          <form onSubmit={handleBook} style={{ marginTop: '1rem' }}>
            <div className="form-group" style={{ maxWidth: '250px' }}>
              <label>Select Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Available Time Slots (Grey = Already Booked)</label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
              <label>Symptoms / Reason for Visit</label>
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