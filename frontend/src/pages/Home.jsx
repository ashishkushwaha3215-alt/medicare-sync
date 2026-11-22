import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DOCTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [quickSpec, setQuickSpec] = useState('');

  useEffect(() => {
    api
      .get('/doctors', { params: { limit: 3 } })
      .then((res) => setFeaturedDoctors(res.data.data || []))
      .catch(() => setFeaturedDoctors([]));
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    navigate(`/doctors${quickSpec ? `?specialization=${encodeURIComponent(quickSpec)}` : ''}`);
  };

  return (
    <div className="container">
      {/* Hero Banner */}
      <section className="hero-section">
        <div>
          <span className="hero-badge">24/7 Smart Digital Healthcare Portal</span>
          <h1 className="hero-title">Your Health, Booked &amp; Synced in Seconds.</h1>
          <p className="hero-subtitle">
            Consult verified Cardiologists, Dermatologists &amp; Physicians. Lock real-time
            appointment slots, receive digital prescriptions, and store lab reports securely.
          </p>

          {/* Quick Search Bar inside Hero */}
          <form
            onSubmit={handleQuickSearch}
            style={{
              display: 'flex',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.14)',
              padding: '0.5rem',
              borderRadius: '12px',
              maxWidth: '480px',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={quickSpec}
              onChange={(e) => setQuickSpec(e.target.value)}
              style={{ flex: 1, minWidth: '190px', border: 'none' }}
            >
              <option value="">All Medical Specializations</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="General Physician">General Physician</option>
            </select>
            <button type="submit" className="btn btn-white">
              Find Slots
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <Link to="/doctors" className="btn btn-white">
              Book Appointment Now
            </Link>
            {!user ? (
              <Link
                to="/login"
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                Patient / Doctor Login
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                Open My Dashboard
              </Link>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <h3>100%</h3>
              <p>Verified Specialists</p>
            </div>
            <div className="hero-stat">
              <h3>Zero</h3>
              <p>Slot Double-Booking</p>
            </div>
            <div className="hero-stat">
              <h3>Instant</h3>
              <p>Digital Rx &amp; Reports</p>
            </div>
          </div>
        </div>

        <div className="hero-image-card">
          <img
            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80"
            alt="MediCare Sync Doctors Team"
          />
        </div>
      </section>

      {/* Featured Verified Doctors with Real Photos & Direct Slot Booking */}
      <section style={{ marginBottom: '2.75rem' }}>
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Top Verified Specialists</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Select a specialist below to check live time slots and book instantly
            </p>
          </div>
          <Link to="/doctors" className="btn btn-outline">
            View All Doctors &rarr;
          </Link>
        </div>

        {featuredDoctors.length === 0 ? (
          <div className="card">Loading specialists...</div>
        ) : (
          <div className="grid-3">
            {featuredDoctors.map((doc, idx) => (
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
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>{doc.user?.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                    {doc.experience} Years Experience · Fee: <strong>₹{doc.consultationFee}</strong>
                  </p>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {(doc.timeSlots || []).slice(0, 3).map((slot) => (
                      <span
                        key={slot}
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/doctors?book=${doc._id}`}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.15rem' }}
                  >
                    Book Time Slot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Role-Based Quick Access Cards */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Complete Healthcare Ecosystem</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
              Dedicated portals for Patients, Doctors, and Clinic Administrators
            </p>
          </div>
        </div>

        <div className="grid-3">
          <div className="card">
            <h3 style={{ color: '#0284c7', marginBottom: '0.4rem' }}>For Patients</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Search doctors by specialization, lock guaranteed time slots, download prescriptions,
              and upload PDF/JPG lab reports.
            </p>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-outline">
              {user ? 'Open Patient Dashboard' : 'Register as Patient'}
            </Link>
          </div>

          <div className="card">
            <h3 style={{ color: '#0d9488', marginBottom: '0.4rem' }}>For Doctors</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Manage daily patient queues, confirm appointments, and issue structured digital
              prescriptions in one click.
            </p>
            <Link to="/login" className="btn btn-outline">
              Doctor Portal Login
            </Link>
          </div>

          <div className="card">
            <h3 style={{ color: '#4f46e5', marginBottom: '0.4rem' }}>For Clinic Admins</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Verify medical credentials, approve/revoke doctor profiles, and monitor live clinic
              appointment analytics.
            </p>
            <Link to="/login" className="btn btn-outline">
              Admin Control Panel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}