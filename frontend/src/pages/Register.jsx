
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartPulse,
  UserRound,
  Mail,
  LockKeyhole,
  Phone,
  Stethoscope,
  BriefcaseMedical,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await register({
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Registration failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 14px 13px 43px',
    border: '1px solid #DCE5EC',
    borderRadius: '11px',
    background: '#F8FAFC',
    fontSize: '14px',
    color: '#102A43',
    outlineColor: '#0D9488',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '9px',
    fontSize: '13px',
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 75px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background:
          'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 55%, #EFF6FF 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '25px',
          }}
        >
          <div
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '19px',
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(13,148,136,0.25)',
              marginBottom: '14px',
            }}
          >
            <HeartPulse size={31} />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              color: '#0D9488',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '1.4px',
              marginBottom: '7px',
            }}
          >
            <Sparkles size={14} />
            JOIN MEDICARE SYNC
          </div>

          <h1
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#102A43',
              margin: '0 0 7px',
              letterSpacing: '-1px',
            }}
          >
            Create Your Account
          </h1>

          <p
            style={{
              color: '#64748B',
              fontSize: '14px',
              margin: 0,
            }}
          >
            Get started with smarter healthcare management.
          </p>
        </div>

        {/* Registration Card */}
        <div
          className="card"
          style={{
            width: '100%',
            padding: '30px',
            border: '1px solid #E2E8F0',
            borderRadius: '22px',
            background: '#FFFFFF',
            boxShadow: '0 20px 55px rgba(16,42,67,0.09)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Account Type */}
            <div className="form-group">
              <label style={labelStyle}>Register As</label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      role: 'patient',
                    }))
                  }
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border:
                      form.role === 'patient'
                        ? '2px solid #0D9488'
                        : '1px solid #DCE5EC',
                    background:
                      form.role === 'patient' ? '#F0FDFA' : '#FFFFFF',
                    color:
                      form.role === 'patient' ? '#0F766E' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '9px',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  <UserRound size={19} />
                  Patient
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      role: 'doctor',
                    }))
                  }
                  style={{
                    padding: '15px 10px',
                    border:
                      form.role === 'doctor'
                        ? '2px solid #0D9488'
                        : '1px solid #DCE5EC',
                    borderRadius: '12px',
                    background:
                      form.role === 'doctor' ? '#F0FDFA' : '#FFFFFF',
                    color:
                      form.role === 'doctor' ? '#0F766E' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '9px',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  <Stethoscope size={19} />
                  Doctor
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label style={labelStyle}>Full Name</label>

              <div style={{ position: 'relative' }}>
                <UserRound size={18} color="#94A3B8" style={iconStyle} />

                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label style={labelStyle}>Email Address</label>

              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#94A3B8" style={iconStyle} />

                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label style={labelStyle}>Password (Minimum 8 Characters)</label>

              <div style={{ position: 'relative' }}>
                <LockKeyhole
                  size={18}
                  color="#94A3B8"
                  style={iconStyle}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  style={{
                    ...fieldStyle,
                    paddingRight: '70px',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#0D9488',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label style={labelStyle}>Phone Number</label>

              <div style={{ position: 'relative' }}>
                <Phone size={18} color="#94A3B8" style={iconStyle} />

                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Doctor Fields */}
            {form.role === 'doctor' && (
              <div
                style={{
                  marginTop: '22px',
                  padding: '20px',
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  borderRadius: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    marginBottom: '18px',
                  }}
                >
                  <BriefcaseMedical size={19} color="#0D9488" />

                  <h3
                    style={{
                      fontSize: '15px',
                      margin: 0,
                      color: '#102A43',
                    }}
                  >
                    Professional Information
                  </h3>
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Specialization</label>

                  <div style={{ position: 'relative' }}>
                    <Stethoscope
                      size={18}
                      color="#94A3B8"
                      style={iconStyle}
                    />

                    <input
                      type="text"
                      name="specialization"
                      required
                      value={form.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiologist"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div className="form-group">
                    <label style={labelStyle}>Experience (Years)</label>

                    <input
                      type="number"
                      name="experience"
                      min={0}
                      required
                      value={form.experience}
                      onChange={handleChange}
                      style={{
                        ...fieldStyle,
                        paddingLeft: '12px',
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={labelStyle}>Fee (₹)</label>

                    <div style={{ position: 'relative' }}>
                      <IndianRupee
                        size={16}
                        color="#94A3B8"
                        style={iconStyle}
                      />

                      <input
                        type="number"
                        name="consultationFee"
                        min={0}
                        required
                        value={form.consultationFee}
                        onChange={handleChange}
                        style={{
                          ...fieldStyle,
                          paddingLeft: '35px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: '49px',
                borderRadius: '11px',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '9px',
                fontSize: '14px',
                fontWeight: 700,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating Account...' : 'Create My Account'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Login Link */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#64748B',
                fontSize: '13px',
                margin: 0,
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#0D9488',
                  fontWeight: 800,
                }}
              >
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            marginTop: '18px',
            color: '#64748B',
            fontSize: '12px',
          }}
        >
          <ShieldCheck size={16} color="#0D9488" />
          Your information is handled securely.
        </div>
      </div>
    </div>
  );
}
