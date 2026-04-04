import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Compass, Settings, UserRound } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v2/notifications?limit=50', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || t('notifications.failedLoad', 'Failed to load notifications.'));
      }
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch (err) {
      showToast(err.message || t('notifications.failedLoad', 'Failed to load notifications.'), { type: 'error' });
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [accessToken]);

  const markAllRead = async () => {
    if (!accessToken || unreadCount <= 0) return;

    try {
      const res = await fetch('/api/v2/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || t('notifications.failedMarkRead', 'Failed to mark notifications as read.'));
      }

      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch (err) {
      showToast(err.message || t('notifications.failedMarkRead', 'Failed to mark notifications as read.'), { type: 'error' });
    }
  };

  const openNotification = (notification) => {
    if (notification?.type === 'follow' && notification?.actor?.id) {
      navigate(`/app/profile/${notification.actor.id}`);
      return;
    }
    navigate('/app/public-decks');
  };

  return (
    <div className="notifications-page">
      <header className="notifications-page__header">
        <div>
          <h1>{t('notifications.title', 'Notifications')}</h1>
          <p>{t('notifications.subtitle', 'Stay updated with your curated learning journey and scholarly achievements.')}</p>
        </div>
        <button
          type="button"
          className="notifications-page__mark-all"
          onClick={markAllRead}
          disabled={unreadCount <= 0}
        >
          {t('nav.markAllRead', 'Mark all read')}
        </button>
      </header>

      {loading ? (
        <div className="notifications-list notifications-list--skeleton" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <article key={index} className="notification-row notification-row--skeleton">
              <div className="notification-row__avatar notification-row__avatar--skeleton sb-skeleton" />
              <div className="notification-row__body">
                <p className="notification-row__line notification-row__line--title sb-skeleton" />
                <small className="notification-row__line notification-row__line--meta sb-skeleton" />
              </div>
            </article>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="notifications-page__empty-panel">
          <p className="notifications-page__status">Status: All Clear</p>
          <div className="notifications-page__icon-wrap">
            <Bell size={28} />
            <span><Check size={11} /></span>
          </div>

          <h2>{t('nav.noNotifications', 'No notifications yet.')}</h2>
          <p className="notifications-page__empty-copy">
            Your digital archive is perfectly quiet. When new research digests, community insights,
            or system updates arrive, they will appear here in your personal curator feed.
          </p>

          <div className="notifications-page__empty-actions">
            <button type="button" onClick={() => navigate('/app/decks')}>
              <Compass size={14} /> Explore Library
            </button>
            <button type="button" className="notifications-page__empty-settings" onClick={() => navigate('/app/settings')}>
              <Settings size={14} /> Settings
            </button>
          </div>

          <small className="notifications-page__version">Learnr / v2.4.0</small>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-row ${notification.readAt ? '' : 'notification-row--unread'}`}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-row__avatar">
                {notification.actor?.avatarUrl ? (
                  <img src={notification.actor.avatarUrl} alt="Actor avatar" loading="lazy" decoding="async" />
                ) : (
                  <UserRound size={14} />
                )}
              </div>
              <div className="notification-row__body">
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
