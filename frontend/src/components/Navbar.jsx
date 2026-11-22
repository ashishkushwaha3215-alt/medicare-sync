import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Stethoscope, LayoutDashboard, FileText, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0d9488)',
            color: '#fff',
            padding: '0.4rem',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTextFillColor: 'initial',
          }}
        >
          <HeartPulse size={22} />
        </span>
        MediCare Sync
      </Link>

      <div className="nav-links">
        <Link to="/doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Stethoscope size={17} /> Find Doctors
        </Link>

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ color: '#fff' }}>
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <LayoutDashboard size={17} /> Dashboard
            </Link>
            {user.role === 'patient' && (
              <Link to="/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={17} /> My Reports
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={17} /> Admin Panel
              </Link>
            )}
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              ({user.name} · <strong>{user.role}</strong>)
            </span>
            <button onClick={handleLogout} className="btn btn-outline">
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}