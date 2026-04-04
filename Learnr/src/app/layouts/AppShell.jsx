import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Zap,
  BookOpen,
  Bell,
  BadgeDollarSign,
  Globe2,
  Languages,
  ChevronDown,
  MessagesSquare,
  LayoutDashboard,
  History,
  Folder,
  Settings,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useI18n from '../../hooks/useI18n';
import './AppShell.css';

const TABS = [
  { to: '/app/generate', label: 'Generate',  Icon: Zap },
  { to: '/app/decks',    label: 'My Decks',  Icon: BookOpen },
  { to: '/app/public-decks', label: 'Public Decks', Icon: Globe2 },
  { to: '/app/studyhub', label: 'StudyHub', Icon: MessagesSquare },
  { to: '/app/pricing',  label: 'Pricing',   Icon: BadgeDollarSign },
];

const SIDE_LINKS = [
  { to: '/app/generate', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/app/studyhub', label: 'Recent Activity', Icon: History },
  { to: '/app/decks', label: 'Library', Icon: BookOpen },
  { to: '/app/public-decks', label: 'Collections', Icon: Folder },
];

const SIDE_BOTTOM_LINKS = [
  { to: '/app/settings', label: 'Settings', Icon: Settings },
  { to: '/app/pricing', label: 'Help', Icon: HelpCircle },
];

export default function AppShell() {
  const { user, accessToken } = useAuth();
  const { language, setLanguage, languages, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const isImmersiveStudy = location.pathname.startsWith('/app/study/');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usagePercent, setUsagePercent] = useState(null);
  const notifMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'SB';

  useEffect(() => {
    if (!accessToken) {
      setAvatarUrl('');
      setUsagePercent(null);
      return;
    }

    Promise.all([
      fetch('/api/v2/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/v2/analytics/usage', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([profileData, usageData]) => {
        setAvatarUrl(profileData?.profile?.avatar_url || '');
        const pct = Number(usageData?.percentages?.generations);
        setUsagePercent(Number.isFinite(pct) ? Math.max(0, Math.min(100, Math.round(pct))) : null);
      })
      .catch(() => {
        setAvatarUrl('');
        setUsagePercent(null);
      });
  }, [accessToken]);

  const fetchNotifications = useCallback(async (limit = 8) => {
    if (!accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotifLoading(true);
    try {
      const res = await fetch(`/api/v2/notifications?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load notifications.');
      }
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications(8);
    const timer = setInterval(() => fetchNotifications(8), 30_000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!notifOpen && !langOpen) return undefined;
    const onPointerDown = (event) => {
      const isInsideNotif = notifMenuRef.current?.contains(event.target);
      const isInsideLang = langMenuRef.current?.contains(event.target);
      if (!isInsideNotif) {
        setNotifOpen(false);
      }
      if (!isInsideLang) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notifOpen, langOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const activeLanguage = languages.find((lang) => lang.code === language) || languages[0];

  const tabsWithLabels = useMemo(
    () => TABS.map(({ to, label, Icon }) => {
      const translatedLabel = label === 'Generate'
        ? t('nav.generate', label)
        : label === 'My Decks'
          ? t('nav.myDecks', label)
          : label === 'Public Decks'
            ? t('nav.publicDecks', label)
            : label === 'StudyHub'
              ? t('nav.studyHub', label)
              : label === 'Pricing'
                ? t('nav.pricing', label)
                : label;

      return { to, Icon, label: translatedLabel };
    }),
    [t],
  );

  if (isImmersiveStudy) {
    return (
      <div className="app-shell app-shell--immersive">
        <main className="app-shell__immersive-main">
          <Outlet />
        </main>
      </div>
    );
  }

  const markAllNotificationsRead = async () => {
    if (!accessToken || unreadCount <= 0) return;
    await fetch('/api/v2/notifications/read-all', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => undefined);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
  };

  const onNotificationClick = (notification) => {
    if (notification?.type === 'follow' && notification?.actor?.id) {
      navigate(`/app/profile/${notification.actor.id}`);
    } else if (notification?.deckId) {
      navigate('/app/public-decks');
    } else {
      navigate('/app/notifications');
    }
    setNotifOpen(false);
  };

  return (
    <div className={`app-shell ${sidebarOpen ? 'app-shell--sidebar-open' : ''}`}>
      <header className="app-shell__topbar">
        <div className="app-shell__top-left">
          <button
            type="button"
            className="app-shell__menu-btn"
            aria-label="Toggle navigation"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <button className="app-shell__brand" onClick={() => navigate('/app/generate')}>
            <span className="app-shell__brand-name">Learnr</span>
          </button>

          <nav className="app-shell__top-nav" aria-label="Primary">
            {tabsWithLabels.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `app-shell__top-link ${isActive ? 'app-shell__top-link--active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="app-shell__top-actions">
          <div className="app-shell__language" ref={langMenuRef}>
            <button
              type="button"
              className={`app-shell__icon-btn ${langOpen ? 'app-shell__icon-btn--active' : ''}`}
              onClick={() => setLangOpen((prev) => !prev)}
              aria-label={t('common.language', 'Language')}
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <Globe2 size={15} />
            </button>

            {langOpen && (
              <div className="app-shell__lang-menu" role="menu" aria-label={t('common.language', 'Language')}>
                <div className="app-shell__lang-head">
                  <Languages size={14} />
                  <span>{activeLanguage?.label || t('common.language', 'Language')}</span>
                  <ChevronDown size={14} />
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={language === lang.code}
                    className={`app-shell__lang-item ${language === lang.code ? 'app-shell__lang-item--active' : ''}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangOpen(false);
                    }}
                  >
                    <span>{lang.label}</span>
                    <small>{lang.code.toUpperCase()}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="app-shell__notifications" ref={notifMenuRef}>
            <button
              className="app-shell__icon-btn"
              aria-label={t('nav.notifications', 'Notifications')}
              onClick={() => {
                const nextOpen = !notifOpen;
                setNotifOpen(nextOpen);
                if (nextOpen) fetchNotifications(8);
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="app-shell__notif-dot">{Math.min(99, unreadCount)}</span>}
            </button>

            {notifOpen && (
              <div className="app-shell__notif-menu">
                <div className="app-shell__notif-head">
                  <strong>{t('nav.notifications', 'Notifications')}</strong>
                  <button type="button" onClick={markAllNotificationsRead} disabled={unreadCount <= 0}>{t('nav.markAllRead', 'Mark all read')}</button>
                </div>

                {notifLoading ? (
                  <div className="app-shell__notif-loading" aria-label={t('common.loading', 'Loading...')}>
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="app-shell__notif-skel-row">
                        <span className="app-shell__notif-skel-dot" />
                        <span className="app-shell__notif-skel-lines">
                          <span className="app-shell__notif-skel-line app-shell__notif-skel-line--main" />
                          <span className="app-shell__notif-skel-line app-shell__notif-skel-line--sub" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="app-shell__notif-empty">{t('nav.noNotifications', 'No notifications yet.')}</p>
                ) : (
                  <ul className="app-shell__notif-list">
                    {notifications.slice(0, 6).map((notification) => (
                      <li key={notification.id}>
                        <button type="button" onClick={() => onNotificationClick(notification)}>
                          <span className={`app-shell__notif-bullet ${notification.readAt ? '' : 'app-shell__notif-bullet--unread'}`} />
                          <span>
                            <span className="app-shell__notif-message">{notification.message}</span>
                            <small>{new Date(notification.createdAt).toLocaleString()}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  className="app-shell__notif-view-all"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/app/notifications');
                  }}
                >
                  {t('nav.viewAllNotifications', 'View all notifications')}
                </button>
              </div>
            )}
          </div>

          <NavLink to={user?.id ? `/app/profile/${user.id}` : '/app/settings'} className="app-shell__avatar" aria-label="Profile">
            {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="app-shell__avatar-img" loading="lazy" decoding="async" />
            ) : (
              initials
            )}
          </NavLink>
        </div>
      </header>

      <div className="app-shell__frame">
        <aside className="app-shell__sidebar" aria-label="Sidebar navigation">
          <section className="app-shell__progress">
            <p className="app-shell__progress-title">Study Progress</p>
            <div className="app-shell__progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usagePercent ?? 0}>
              <span style={{ width: `${usagePercent ?? 0}%` }} />
            </div>
            <small>Quota: {usagePercent ?? 0}% used</small>
          </section>

          <nav className="app-shell__side-links">
            {SIDE_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `app-shell__side-link ${isActive ? 'app-shell__side-link--active' : ''}`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="app-shell__upgrade-btn"
            onClick={() => navigate('/app/pricing')}
          >
            Upgrade Plan
          </button>

          <nav className="app-shell__side-links app-shell__side-links--bottom">
            {SIDE_BOTTOM_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `app-shell__side-link app-shell__side-link--subtle ${isActive ? 'app-shell__side-link--active' : ''}`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <button type="button" className="app-shell__overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <nav className="app-shell__bottom-nav">
        {tabsWithLabels.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `app-shell__bottom-tab ${isActive ? 'app-shell__bottom-tab--active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
