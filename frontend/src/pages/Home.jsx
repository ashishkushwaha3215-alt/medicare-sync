import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.75rem' }}>
          Smart Clinic &amp; Patient Portal
        </h1>
        <p style={{ color: '#475569', maxWidth: '620px', margin: '0 auto 1.5rem' }}>
          Book verified specialists in seconds, avoid waiting room queues with real-time slot
          availability, and access digital prescriptions &amp; lab reports anywhere.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/doctors" className="btn btn-primary">
            Browse Doctors
          </Link>
          {!user ? (
            <Link to="/register" className="btn btn-outline">
              Create Free Account
            </Link>
          ) : (
            <Link to="/dashboard" className="btn btn-outline">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: '1.75rem' }}>
        <div className="card">
          <h3 style={{ color: '#0284c7', marginBottom: '0.4rem' }}>1. Find Specialists</h3>
          <p style={{ color: '#475569', fontSize: '0.92rem' }}>
            Search doctors by name or specialization, check consultation fees, and view real-time
            available time slots.
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: '#0284c7', marginBottom: '0.4rem' }}>2. Instant Slot Booking</h3>
          <p style={{ color: '#475569', fontSize: '0.92rem' }}>
            Zero double-booking conflicts—booked slots automatically lock so your appointment time
            is guaranteed.
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: '#0284c7', marginBottom: '0.4rem' }}>3. Digital Health Vault</h3>
          <p style={{ color: '#475569', fontSize: '0.92rem' }}>
            Upload lab reports (PDF/JPG/PNG) securely and receive digital prescriptions directly on
            your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}