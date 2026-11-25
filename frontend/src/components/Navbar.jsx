
import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import {
  HeartPulse,
  Stethoscope,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  LogOut,
  Home,
  UserRound,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!user) return;

    if (showLoader) {
      setNotificationsLoading(true);
    }

    try {
      const response = await api.get('/notifications?limit=20');

      const data = response.data?.data;

      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(Number(response.data?.unreadCount) || 0);
    } catch (error) {
      console.error(
        'Notification fetch error:',
        error.response?.data || error.message
      );
    } finally {
      if (showLoader) {
        setNotificationsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to mark notification as read'
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to update notifications'
      );
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);

      const deletedNotification = notifications.find(
        (item) => item._id === id
      );

      setNotifications((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      toast.success('Notification deleted');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to delete notification'
      );
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_booked':
        return <CalendarIconFallback />;

      case 'appointment_confirmed':
        return <Check size={17} />;

      case 'appointment_cancelled':
        return <X size={17} />;

      case 'appointment_completed':
        return <CheckCheck size={17} />;

      default:
        return <Bell size={17} />;
    }
  };

  const formatNotificationDate = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '';

    return parsedDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const navClass = ({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`;

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="brand" onClick={closeMenus}>
        <span className="brand-icon">
          <HeartPulse size={23} />
        </span>

        <span>
          MediCare <span className="brand-highlight">Sync</span>
        </span>
      </Link>

      {/* Mobile Menu Button */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={23} /> : <Menu size={23} />}
      </button>

      {/* Navigation */}
      <div className={`navbar-content ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="nav-links">
          <NavLink to="/" end className={navClass} onClick={closeMenus}>
            <Home size={17} />
            Home
          </NavLink>

          <NavLink to="/doctors" className={navClass} onClick={closeMenus}>
            <Stethoscope size={17} />
            Find Doctors
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={navClass}
                onClick={closeMenus}
              >
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>

              {user.role === 'patient' && (
                <NavLink
                  to="/reports"
                  className={navClass}
                  onClick={closeMenus}
                >
                  <FileText size={17} />
                  My Reports
                </NavLink>
              )}

              {user.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={navClass}
                  onClick={closeMenus}
                >
                  <ShieldCheck size={17} />
                  Admin Panel
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="nav-actions">
          {!user ? (
            <>
              <NavLink
                to="/login"
                className="nav-login"
                onClick={closeMenus}
              >
                Login
              </NavLink>

              <Link
                to="/register"
                className="nav-register"
                onClick={closeMenus}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              {/* Notifications */}
              <div className="nav-dropdown">
                <button
                  type="button"
                  className={`nav-icon-button ${
                    notificationsOpen ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false);

                    if (!notificationsOpen) {
                      fetchNotifications(true);
                    }
                  }}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={notificationsOpen}
                >
                  <Bell size={19} />

                  {unreadCount > 0 && (
                    <span className="notification-count">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="nav-dropdown-menu notification-menu">
                    <div className="dropdown-heading">
                      <div>
                        <strong>Notifications</strong>
                        <span className="notification-status">
                          {unreadCount} unread
                        </span>
                      </div>

                      <div className="notification-actions">
                        <button
                          type="button"
                          title="Refresh notifications"
                          onClick={() => fetchNotifications(true)}
                        >
                          <RefreshCw size={15} />
                        </button>

                        {unreadCount > 0 && (
                          <button
                            type="button"
                            title="Mark all as read"
                            onClick={handleMarkAllAsRead}
                          >
                            <CheckCheck size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="notification-list">
                      {notificationsLoading ? (
                        <div className="notification-empty">
                          <RefreshCw size={23} />
                          <strong>Loading notifications...</strong>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notification-empty">
                          <Bell size={25} />
                          <strong>No notifications yet</strong>
                          <p>Your important updates will appear here.</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`notification-item ${
                              !notification.isRead ? 'unread' : ''
                            }`}
                          >
                            <div className="notification-icon">
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="notification-content">
                              <strong>{notification.title}</strong>

                              <p>{notification.message}</p>

                              <small>
                                {formatNotificationDate(notification.createdAt)}
                              </small>

                              {!notification.isRead && (
                                <button
                                  type="button"
                                  className="notification-read-button"
                                  onClick={() =>
                                    handleMarkAsRead(notification._id)
                                  }
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              className="notification-delete"
                              title="Delete notification"
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* View All Notifications */}
                    <Link
                      to="/notifications"
                      className="view-all-notifications"
                      onClick={closeMenus}
                    >
                      View All Notifications
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="nav-dropdown">
                <button
                  type="button"
                  className={`profile-trigger ${
                    profileOpen ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  aria-expanded={profileOpen}
                >
                  <span className="profile-avatar">
                    <UserRound size={19} />
                  </span>

                  <span className="profile-info">
                    <strong>{user.name || 'User'}</strong>
                    <small>{user.role || 'Member'}</small>
                  </span>

                  <ChevronDown size={16} />
                </button>

                {profileOpen && (
                  <div className="nav-dropdown-menu profile-menu">
                    <div className="profile-menu-header">
                      <strong>{user.name || 'User'}</strong>
                      <span>{user.email || user.role}</span>
                    </div>

                    <Link to="/profile" onClick={closeMenus}>
                      <UserRound size={17} />
                      My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
                        navigate('/profile');
                      }}
                    >
                      <Settings size={17} />
                      Account Settings
                    </button>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="logout-dropdown"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function CalendarIconFallback() {
  return <FileText size={17} />;
}
