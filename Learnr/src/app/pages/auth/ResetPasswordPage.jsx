import { Link, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import './AuthPages.css';

const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, isSupabaseConfigured, user, loading } = useAuth();
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidRecoveryLink, setInvalidRecoveryLink] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || loading) return;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    const hasRecoveryToken = hash.get('type') === 'recovery' || search.get('type') === 'recovery';

    if (!hasRecoveryToken && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (hasRecoveryToken && !user) {
      setInvalidRecoveryLink(true);
      setReady(true);
      return;
    }

    setInvalidRecoveryLink(false);
    setReady(true);
  }, [isSupabaseConfigured, loading, user, navigate]);

  const handleResetPassword = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/app/generate');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className={`auth-page auth-page--single ${isLightTheme ? 'auth-page--light' : ''}`}>
        <div className="auth-page__form-side auth-page__form-side--centered">
          <div className="auth-page__brand auth-page__brand--inline">
            <span>Learnr</span>
          </div>

          <div className="auth-page__card auth-success auth-success--left">
            <div className="auth-success__icon"><CheckCircle2 size={22} /></div>
            <h2>Check your email</h2>
            <p>Your password was updated successfully. Redirecting you to the app...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className={`auth-page auth-page--single ${isLightTheme ? 'auth-page--light' : ''}`}>
        <div className="auth-page__form-side auth-page__form-side--centered">
          <div className="auth-page__card auth-success auth-success--left">
            <h2>Preparing reset...</h2>
            <p>Verifying your password reset link.</p>
            <div className="auth-inline-skeleton" aria-hidden="true">
              <div className="auth-inline-skeleton__line auth-inline-skeleton__line--wide" />
              <div className="auth-inline-skeleton__line" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invalidRecoveryLink) {
    return (
      <div className={`auth-page auth-page--single ${isLightTheme ? 'auth-page--light' : ''}`}>
        <div className="auth-page__form-side auth-page__form-side--centered">
          <div className="auth-page__card auth-success auth-success--left">
            <h2>Reset Link Expired</h2>
            <p>
            This password reset link is invalid or has expired. Request a new reset link from the login page.
            </p>
            <button
              className="auth-btn auth-btn--primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured || !user) {
    return null;
  }

  return (
    <div className={`auth-page ${isLightTheme ? 'auth-page--light' : ''}`}>
        <div className="auth-page__form-side">
        <div className="auth-page__brand" onClick={() => navigate('/') }>
          <span>Learnr</span>
        </div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="auth-page__card">
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => navigate('/login')}
            style={{ marginBottom: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={14} /> Back to login
          </button>

          <h1 className="auth-page__h1">Forgot password?</h1>
          <p className="auth-page__sub">Enter a fresh password to secure your account and continue your journey.</p>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <div className="auth-field">
            <label>New Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
                autoComplete="new-password"
              />
              <button type="button" className="auth-input-eye" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <small style={{ color: 'var(--t3)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>At least 8 characters</small>
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="auth-input"
                autoComplete="new-password"
              />
              <button type="button" className="auth-input-eye" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            className="auth-btn auth-btn--primary"
            onClick={handleResetPassword}
            disabled={busy || !password || !confirmPassword}
          >
            {busy ? (
              <span className="auth-btn__skeleton" aria-hidden="true">
                <span className="auth-btn__skeleton-dot" />
                <span className="auth-btn__skeleton-line" />
              </span>
            ) : 'Reset Password'}
          </button>

          <p className="auth-page__switch">
            Need help? <Link className="auth-link" to="/pricing">Contact support</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-page__art-side">
        <div className="auth-art">
          <div className="auth-art__glow" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="auth-art__tagline"
          >
            <h3>Secure your account</h3>
            <p>A strong password is your first line of defense against unauthorized access.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
