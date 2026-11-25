
import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  CalendarCheck,
  XCircle,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const notificationIcons = {
  appointment_booked: CalendarCheck,
  appointment_confirmed: CheckCheck,
  appointment_cancelled: XCircle,
  appointment_completed: FileText,
  system: Info,
};

const formatDate = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 10,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: 10,
      };

      if (activeFilter === 'unread') {
        params.unread = true;
      }

      const response = await api.get('/notifications', { params });

      setNotifications(response.data?.data || []);
      setUnreadCount(Number(response.data?.unreadCount) || 0);

      const paginationData = response.data?.pagination || {};

      setPagination({
        total: Number(paginationData.total) || 0,
        pages: Math.max(1, Number(paginationData.pages) || 1),
        limit: Number(paginationData.limit) || 10,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to load notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to update notification'
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to update notifications'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification deleted');

      if (notifications.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        fetchNotifications();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to delete notification'
      );
    }
  };

  const getNotificationIcon = (type) => {
    const Icon = notificationIcons[type] || Bell;
    return Icon;
  };

  return (
    <main className="notification-center-page">
      <div className="container">
        <div className="notification-page-header">
          <div>
            <span className="notification-page-eyebrow">
              MEDICARE SYNC
            </span>

            <h1>Notification Center</h1>

            <p>
              Stay updated with your appointments and important account
              activities.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="notification-stats">
          <div className="notification-stat-card">
            <span className="notification-stat-icon">
              <Bell size={21} />
            </span>
            <div>
              <strong>{pagination.total}</strong>
              <span>Total Notifications</span>
            </div>
          </div>

          <div className="notification-stat-card">
            <span className="notification-stat-icon unread-stat">
              <Info size={21} />
            </span>
            <div>
              <strong>{unreadCount}</strong>
              <span>Unread Notifications</span>
            </div>
          </div>
        </div>

        <section className="notification-center-card">
          <div className="notification-center-toolbar">
            <div>
              <h2>Your Notifications</h2>
              <p>Manage all your important updates in one place.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || loading}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>

          <div className="notification-filters">
            <button
              type="button"
              className={activeFilter === 'all' ? 'active' : ''}
              onClick={() => changeFilter('all')}
            >
              All
            </button>

            <button
              type="button"
              className={activeFilter === 'unread' ? 'active' : ''}
              onClick={() => changeFilter('unread')}
            >
              Unread
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
          </div>

          {loading ? (
            <div className="notification-page-empty">
              <RefreshCw size={28} className="notification-loading-icon" />
              <h3>Loading notifications...</h3>
              <p>Please wait while we fetch your updates.</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-page-empty">
              <span className="notification-empty-icon">
                <Bell size={30} />
              </span>

              <h3>
                {activeFilter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </h3>

              <p>
                {activeFilter === 'unread'
                  ? 'You are all caught up.'
                  : 'Your important updates will appear here.'}
              </p>
            </div>
          ) : (
            <div className="notification-center-list">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);

                return (
                  <article
                    key={notification._id}
                    className={`notification-center-item ${
                      !notification.isRead ? 'unread' : ''
                    }`}
                  >
                    <div className="notification-center-icon">
                      <Icon size={21} />
                    </div>

                    <div className="notification-center-content">
                      <div className="notification-center-title">
                        <h3>{notification.title}</h3>

                        {!notification.isRead && (
                          <span className="notification-unread-label">
                            New
                          </span>
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <time>
                        {formatDate(notification.createdAt)}
                      </time>
                    </div>

                    <div className="notification-center-actions">
                      {!notification.isRead && (
                        <button
                          type="button"
                          title="Mark as read"
                          onClick={() =>
                            handleMarkAsRead(notification._id)
                          }
                        >
                          <Check size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        className="delete"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && pagination.pages > 1 && (
            <div className="notification-pagination">
              <span>
                Page {page} of {pagination.pages}
              </span>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => previous - 1)}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
