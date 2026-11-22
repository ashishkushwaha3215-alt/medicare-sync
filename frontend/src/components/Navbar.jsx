import { Link, useNavigate } from 'react-router-dom';
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
        MediCare Sync
      </Link>

      <div className="nav-links">
        <Link to="/doctors">Find Doctors</Link>

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ color: '#fff' }}>
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user.role === 'patient' && <Link to="/reports">My Reports</Link>}
            {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              ({user.name} · <strong>{user.role}</strong>)
            </span>
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}