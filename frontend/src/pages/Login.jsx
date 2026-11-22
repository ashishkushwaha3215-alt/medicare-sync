import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123');
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '2rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Login to MediCare Sync</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.85rem',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
            Quick Demo Logins (Click to fill):
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillDemo('patient@demo.com')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              Patient Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('doctor@demo.com')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              Doctor Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@demo.com')}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              Admin Demo
            </button>
          </div>
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New user? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}