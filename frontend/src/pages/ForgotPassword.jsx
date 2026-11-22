import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      if (res.data.resetToken) {
        setResetLink(`/reset-password/${res.data.resetToken}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '2.5rem' }}>
      <div className="card">
        <h2 className="text-xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-sm text-slate-600 text-center mb-4">
          Enter your registered email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Registered Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@demo.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Generating Link...' : 'Send Reset Link'}
          </button>
        </form>

        {resetLink && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm">
            <p className="font-semibold text-sky-900 mb-1">Instant Demo Reset Link Ready:</p>
            <Link to={resetLink} className="text-sky-600 underline font-medium break-all">
              Click here to reset your password now &rarr;
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-sm">
          Remembered your password? <Link to="/login" className="text-sky-600 font-semibold">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}