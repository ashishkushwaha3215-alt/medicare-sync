
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartPulse,
  Mail,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  UserRound,
  Stethoscope,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await login(email.trim(), password);
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

  const demoAccounts = [
    {
      label: 'Patient',
      email: 'patient@demo.com',
      icon: UserRound,
    },
    {
      label: 'Doctor',
      email: 'doctor@demo.com',
      icon: Stethoscope,
    },
    {
      label: 'Admin',
      email: 'admin@demo.com',
      icon: Shield,
    },
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 75px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 55%, #EFF6FF 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(13, 148, 136, 0.25)',
              marginBottom: '16px',
            }}
          >
            <HeartPulse size={32} strokeWidth={2.2} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#0D9488',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={14} />
            Welcome Back
          </div>

          <h1
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#102A43',
              margin: '0 0 8px',
              letterSpacing: '-1px',
            }}
          >
            Login to MediCare Sync
          </h1>

          <p
            style={{
              color: '#64748B',
              fontSize: '14px',
              margin: 0,
            }}
          >
            Access your healthcare dashboard securely.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '32px',
            border: '1px solid #E2E8F0',
            borderRadius: '22px',
            boxShadow: '0 20px 55px rgba(16, 42, 67, 0.09)',
            background: '#FFFFFF',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '9px',
                  fontSize: '13px',
                }}
              >
                Email Address
              </label>

              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="#94A3B8"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '13px 14px 13px 43px',
                    border: '1px solid #DCE5EC',
                    borderRadius: '11px',
                    background: '#F8FAFC',
                    fontSize: '14px',
                    outlineColor: '#0D9488',
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '9px',
                  fontSize: '13px',
                }}
              >
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <LockKeyhole
                  size={18}
                  color="#94A3B8"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '13px 75px 13px 43px',
                    border: '1px solid #DCE5EC',
                    borderRadius: '11px',
                    background: '#F8FAFC',
                    fontSize: '14px',
                    outlineColor: '#0D9488',
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
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <Link
                to="/forgot-password"
                style={{
                  color: '#0D9488',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: '48px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                fontWeight: 700,
                fontSize: '14px',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Logging in...' : 'Login to Your Account'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '25px 0 20px',
            }}
          >
            <div style={{ height: '1px', background: '#E2E8F0', flex: 1 }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '1px',
              }}
            >
              OR TRY DEMO
            </span>
            <div style={{ height: '1px', background: '#E2E8F0', flex: 1 }} />
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#64748B',
              marginBottom: '13px',
            }}
          >
            Select a demo account to fill login details.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '9px',
            }}
          >
            {demoAccounts.map((account) => {
              const Icon = account.icon;

              return (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="btn btn-outline"
                  style={{
                    padding: '12px 5px',
                    borderRadius: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Icon size={19} />
                  {account.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              New to MediCare Sync?{' '}
              <Link
                to="/register"
                style={{
                  color: '#0D9488',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            marginTop: '20px',
            color: '#64748B',
            fontSize: '12px',
          }}
        >
          <ShieldCheck size={16} color="#0D9488" />
          Your healthcare information is protected.
        </div>
      </div>
    </div>
  );
}
