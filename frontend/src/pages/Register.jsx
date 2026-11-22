import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    phone: '',
    specialization: 'General Physician',
    experience: 2,
    consultationFee: 500,
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '1.5rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Register As</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Amit Kumar"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="amit@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
            />
          </div>

          {form.role === 'doctor' && (
            <>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  required
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="Cardiologist, Dermatologist..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    min={0}
                    value={form.experience}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Fee (₹)</label>
                  <input
                    type="number"
                    name="consultationFee"
                    min={0}
                    value={form.consultationFee}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}