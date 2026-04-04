import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Award, TrendingUp, HardDrive, Moon, Shield, LogOut } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../context/ThemeContext';
import useI18n from '../../../hooks/useI18n';
import './ProfilePage.css';

function Toggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      className={`profile-toggle ${on ? 'profile-toggle--on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="profile-toggle__thumb" />
    </button>
  );
}

function CompactToggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`profile-compact-toggle ${on ? 'profile-compact-toggle--on' : ''}`}
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
    >
      <span />
    </button>
  );
}

export default function ProfilePage() {
  const { user, signOut, accessToken, updatePassword, signInWithPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { t } = useI18n();
  const isDarkMode = theme === 'dark';
  const avatarInputRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usage, setUsage] = useState(null);
  const [billing, setBilling] = useState(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [studyGraph, setStudyGraph] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState('none');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';
  const initials    = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const email       = user?.email ?? '';

  useEffect(() => {
    if (!accessToken) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);

    Promise.all([
      fetch('/api/v2/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile.')))),
      fetch('/api/v2/analytics/usage', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load usage.')))),
      fetch('/api/v2/billing/status', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load billing status.')))),
      fetch('/api/v2/analytics/streak', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load streak.')))),
      fetch('/api/v2/analytics/study-graph?days=30', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load study graph.')))),
    ])
      .then(([profileData, usageData, billingData, streakData, graphData]) => {
        setAvatarUrl(profileData?.profile?.avatar_url || '');
        setSubscriptionTier(profileData?.profile?.subscription_tier || usageData?.subscriptionTier || 'none');
        setUsage(usageData || null);
        setBilling(billingData?.profile || null);
        setStreak(streakData || { currentStreak: 0, longestStreak: 0 });
        setStudyGraph(graphData?.points || []);
      })
      .catch(() => {
        setAvatarUrl('');
        setUsage(null);
        setBilling(null);
        setStreak({ currentStreak: 0, longestStreak: 0 });
        setStudyGraph([]);
      })
      .finally(() => setProfileLoading(false));
  }, [accessToken]);

  const storagePct = usage?.percentages?.storage ?? 0;
  const generationsUsed = usage?.usage?.generations ?? 0;
  const generationLimit = usage?.limits?.generations ?? 0;
  const tierLabel = subscriptionTier === 'ultra'
    ? 'Ultra Member'
    : subscriptionTier === 'premium'
      ? 'Premium Member'
      : 'No Subscription';

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const handleAvatarFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast(t('profile.avatarTypeError', 'Avatar must be JPEG, PNG, or WEBP.'), { type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('profile.avatarSizeError', 'Avatar exceeds 5MB limit.'), { type: 'error' });
      return;
    }

    if (!accessToken) {
      showToast(t('profile.signInUploadAvatar', 'Please sign in to upload avatar.'), { type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64Data = await fileToBase64(file);
      const res = await fetch('/api/v2/profile/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mimeType: file.type,
          fileName: file.name,
          base64Data,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || t('profile.uploadAvatarFailed', 'Failed to upload avatar.'));
      }

      setAvatarUrl(payload.avatar_url || '');
      showToast(t('profile.profilePhotoUpdated', 'Profile photo updated.'), { type: 'success' });
    } catch (err) {
      showToast(err.message || t('profile.uploadAvatarFailed', 'Failed to upload avatar.'), { type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!email) {
      showToast(t('profile.noEmailFound', 'No account email found for password update.'), { type: 'error' });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t('profile.fillPasswordFields', 'Please fill all password fields.'), { type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      showToast(t('profile.passwordLengthError', 'New password must be at least 8 characters.'), { type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('profile.passwordMismatch', 'New password and confirmation do not match.'), { type: 'error' });
      return;
    }

    if (currentPassword === newPassword) {
      showToast(t('profile.passwordSameError', 'New password must be different from current password.'), { type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      await signInWithPassword(email, currentPassword);
      await updatePassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      showToast(t('profile.passwordUpdated', 'Password updated successfully.'), { type: 'success' });
    } catch (err) {
      showToast(err.message || t('profile.passwordUpdateFailed', 'Failed to update password.'), { type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="profile-page">
      {/* Panel */}
      <motion.div
        className="profile-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 220, damping: 24 }}
      >
        {/* Header */}
        <div className="profile-panel__header">
          <h2 className="profile-panel__title">{t('profile.title', 'Account Settings')}</h2>
          <p className="profile-panel__subtitle">Manage your profile, subscription, and learning preferences.</p>
        </div>

        {/* Avatar + identity */}
        <div className="profile-hero-grid">
          <section className="profile-hero-card">
            <div className="profile-identity">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile avatar" className="profile-avatar__img" loading="lazy" decoding="async" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  className="profile-avatar-edit"
                  aria-label={t('profile.changePhoto', 'Change photo')}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarFile}
                  style={{ display: 'none' }}
                />
              </div>
              <div>
                <p className="profile-identity__name">
                  {profileLoading ? <span className="profile-skeleton-line profile-skeleton-line--name" /> : displayName}
                </p>
                <div className="profile-identity__badge">
                  <Award size={11} />
                  {profileLoading ? <span className="profile-skeleton-line profile-skeleton-line--badge" /> : tierLabel}
                </div>
                <p className="profile-identity__email">
                  {profileLoading ? <span className="profile-skeleton-line profile-skeleton-line--email" /> : email}
                </p>
              </div>
            </div>
            <div className="profile-hero-card__actions">
              <button type="button" className="profile-hero-card__btn" onClick={() => setShowPasswordForm((prev) => !prev)}>
                {t('profile.changePassword', 'Change Password')}
              </button>
              <button type="button" className="profile-hero-card__btn profile-hero-card__btn--ghost" onClick={() => window.open(`/app/profile/${user?.id || ''}`, '_self')}>
                View Public Profile
              </button>
            </div>
          </section>

          <section className="profile-plan-card">
            <p className="profile-plan-card__badge">Current Plan</p>
            <h3>{subscriptionTier === 'ultra' ? 'Ultra Plan' : subscriptionTier === 'premium' ? 'Premium Plan' : 'Starter Plan'}</h3>
            <p>{t('profile.subscriptionStatus', 'Subscription status: {status}', { status: billing?.stripeSubscriptionStatus || 'none' })}</p>
            <div className="profile-plan-card__price">{subscriptionTier === 'ultra' ? '$29.99' : subscriptionTier === 'premium' ? '$14.99' : '$0.00'} <small>/ month</small></div>
            <button type="button" onClick={() => window.open('/app/pricing', '_self')}>Manage Subscription</button>
          </section>
        </div>

        {/* Stats */}
        {profileLoading ? (
          <div className="profile-stats" aria-hidden="true">
            <div className="profile-stat profile-stat--skeleton">
              <div className="profile-stat__icon profile-stat__icon--purple profile-stat__icon--skeleton" />
              <div className="profile-stat__content">
                <span className="profile-stat-skeleton profile-stat-skeleton--value" />
                <span className="profile-stat-skeleton profile-stat-skeleton--label" />
              </div>
            </div>
            <div className="profile-stat profile-stat--skeleton">
              <div className="profile-stat__icon profile-stat__icon--cyan profile-stat__icon--skeleton" />
              <div className="profile-stat__content">
                <span className="profile-stat-skeleton profile-stat-skeleton--value" />
                <span className="profile-stat-skeleton profile-stat-skeleton--label" />
              </div>
            </div>
            <div className="profile-stat profile-stat--skeleton">
              <div className="profile-stat__icon profile-stat__icon--purple profile-stat__icon--skeleton" />
              <div className="profile-stat__content">
                <span className="profile-stat-skeleton profile-stat-skeleton--value" />
                <span className="profile-stat-skeleton profile-stat-skeleton--label" />
              </div>
            </div>
            <div className="profile-stat profile-stat--skeleton">
              <div className="profile-stat__icon profile-stat__icon--cyan profile-stat__icon--skeleton" />
              <div className="profile-stat__content">
                <span className="profile-stat-skeleton profile-stat-skeleton--value" />
                <span className="profile-stat-skeleton profile-stat-skeleton--label" />
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--purple">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="profile-stat__val">{generationsUsed.toLocaleString()}</p>
                <p className="profile-stat__key">{t('profile.generationsMax', 'Generations ({max} max)', { max: generationLimit.toLocaleString() })}</p>
              </div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--cyan">
                <HardDrive size={16} />
              </div>
              <div className="profile-stat__storage">
                <div className="profile-stat__storage-row">
                  <p className="profile-stat__val">{storagePct}%</p>
                  <p className="profile-stat__key">{t('profile.storage', 'Storage')}</p>
                </div>
                <div className="profile-stat__bar">
                  <div className="profile-stat__bar-fill" style={{ width: `${storagePct}%` }} />
                </div>
              </div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--purple">
                <Award size={16} />
              </div>
              <div>
                <p className="profile-stat__val">{(streak.currentStreak || 0).toLocaleString()}</p>
                <p className="profile-stat__key">Current Streak</p>
              </div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--cyan">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="profile-stat__val">{t('profile.live', 'Live')}</p>
                <p className="profile-stat__key">Status</p>
              </div>
            </div>
          </div>
        )}

        <div className="profile-content-grid">
          <section className="profile-section profile-section--activity">
            <p className="profile-section__label">{t('profile.studyActivity', 'STUDY ACTIVITY')}</p>
            <div className="profile-activity">
              <div className="profile-activity__streaks">
                <div className="profile-activity__streak-card">
                  <p className="profile-activity__streak-label">{t('profile.currentStreak', 'Current Streak')}</p>
                  <p className="profile-activity__streak-value">{streak.currentStreak || 0} {t('profile.days', 'days')}</p>
                </div>
                <div className="profile-activity__streak-card">
                  <p className="profile-activity__streak-label">{t('profile.longestStreak', 'Longest Streak')}</p>
                  <p className="profile-activity__streak-value">{streak.longestStreak || 0} {t('profile.days', 'days')}</p>
                </div>
              </div>

              {studyGraph.length > 0 ? (
                <div className="profile-activity__graph" aria-label={t('profile.studyGraphAria', '30 day study graph')}>
                  {studyGraph.map((point) => {
                    const qHeight = Math.max(8, Math.min(100, point.questionsAnswered * 6));
                    const dHeight = Math.max(6, Math.min(100, point.decksStudied * 14));
                    return (
                      <div key={point.date} className="profile-activity__col" title={`${point.date}: ${point.questionsAnswered} questions, ${point.decksStudied} decks`}>
                        <span className="profile-activity__bar profile-activity__bar--questions" style={{ height: `${qHeight}%` }} />
                        <span className="profile-activity__bar profile-activity__bar--decks" style={{ height: `${dHeight}%` }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="profile-activity__empty">{t('profile.noStudyActivity', 'No study activity yet. Complete a session to start your streak.')}</p>
              )}
            </div>
          </section>

          <section className="profile-section profile-section--prefs">
            <p className="profile-section__label">Preferences</p>

            <div className="profile-row profile-row--compact">
              <Moon size={15} className="profile-row__icon" />
              <span className="profile-row__label">{t('profile.darkMode', 'Dark Mode')}</span>
              <CompactToggle on={isDarkMode} onChange={toggleTheme} />
            </div>

            <div className="profile-row profile-row--compact">
              <TrendingUp size={15} className="profile-row__icon" />
              <span className="profile-row__label">Email Updates</span>
              <CompactToggle on={emailUpdates} onChange={setEmailUpdates} />
            </div>

            <p className="profile-section__label profile-section__label--inner">{t('profile.security', 'SECURITY')}</p>

            <button
              className="profile-row profile-row--btn profile-row--compact"
              type="button"
              onClick={() => {
                if (changingPassword) return;
                setShowPasswordForm((prev) => !prev);
              }}
            >
              <Shield size={15} className="profile-row__icon" />
              <span className="profile-row__label">{t('profile.changePassword', 'Change Password')}</span>
            </button>

            {showPasswordForm && (
              <form className="profile-password-form" onSubmit={handleChangePassword}>
                <label className="profile-password-form__label" htmlFor="profile-current-password">
                  {t('profile.currentPassword', 'Current password')}
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  className="profile-password-form__input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={changingPassword}
                />

                <label className="profile-password-form__label" htmlFor="profile-new-password">
                  {t('profile.newPassword', 'New password')}
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  className="profile-password-form__input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={changingPassword}
                />

                <label className="profile-password-form__label" htmlFor="profile-confirm-password">
                  {t('profile.confirmPassword', 'Confirm new password')}
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  className="profile-password-form__input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={changingPassword}
                />

                <div className="profile-password-form__actions">
                  <button type="submit" className="profile-password-form__submit" disabled={changingPassword}>
                    {changingPassword ? t('common.loading', 'Loading...') : t('profile.updatePassword', 'Update Password')}
                  </button>
                </div>
              </form>
            )}

            <button className="profile-signout" onClick={handleSignOut}>
              <LogOut size={15} />
              {t('profile.signOut', 'Sign Out')}
            </button>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
