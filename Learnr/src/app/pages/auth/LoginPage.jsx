import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Eye, EyeOff, Chrome, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import './AuthPages.css';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

function LoginShowcase() {
  return (
    <div className="auth-showcase auth-showcase--login">
      <div className="auth-showcase__top-pill">
        <span className="auth-showcase__dot" /> AI generation active
      </div>

      <div className="auth-preview-card">
        <p className="auth-preview-card__meta">Neuroscience • Deck #402</p>
        <h3>Neural Plasticity</h3>
        <div className="auth-preview-card__media" />
        <div className="auth-preview-card__chips">
          <span>Synaptic Pruning</span>
          <span>Cortical Remapping</span>
        </div>
        <p className="auth-preview-card__body">
          The ability of the nervous system to change its activity in response to intrinsic or extrinsic stimuli by reorganizing its structure, functions, or connections.
        </p>
        <div className="auth-preview-card__footer">
          <div className="auth-preview-card__avatars">
            <span />
            <span />
            <span className="auth-preview-card__avatar-count">+12k</span>
          </div>
          <strong>Highly Effective</strong>
        </div>
      </div>

      <div className="auth-showcase__quote">
        <p>The curator perspective</p>
        <blockquote>Learning is not a task, it is the architecture of the mind.</blockquote>
      </div>
    </div>
  );
}

function RecoveryShowcase() {
  return (
    <div className="auth-showcase auth-showcase--recovery">
      <span className="auth-showcase__concept-pill">Concept preview</span>
      <h3>AI-Curated Foundations</h3>

      <div className="auth-recovery-card">
        <p className="auth-recovery-card__meta">Neuroscience • Advanced</p>
        <h4>Neural Plasticity</h4>
        <div className="auth-recovery-card__image" />
        <p className="auth-recovery-card__caption">
          The brain&apos;s ability to reorganize itself by forming new neural connections throughout life.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithGoogle, sendMagicLink, resetPassword, isSupabaseConfigured } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  const isRecoveryView = mode === 'forgot' || mode === 'reset-sent';
  const isLightTheme = theme === 'light';
  const useLightLayout = isLightTheme || isRecoveryView;

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      navigate('/app/generate');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setBusy(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setMode('reset-sent');
    } catch (err) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setBusy(false);
    }
  };

  const handleMagicLink = async () => {
    setBusy(true);
    setError('');
    try {
      await sendMagicLink(email.trim());
      setMode('magic-sent');
    } catch (err) {
      setError(err.message || 'Failed to send magic link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`auth-page ${useLightLayout ? 'auth-page--light' : ''}`}>
      <div className="auth-page__form-side">
        <Link to="/" className={`auth-page__brand ${useLightLayout ? 'auth-page__brand--dark' : ''}`}>
          <div className="auth-page__brand-logo"><Sparkles size={16} /></div>
          <span>Learnr</span>
        </Link>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className={`auth-page__card ${isRecoveryView ? 'auth-page__card--recovery' : ''}`}>
          {mode === 'reset-sent' ? (
            <div className="auth-success auth-success--left">
              <button
                type="button"
                className="auth-link-btn auth-link-btn--back"
                onClick={() => { setMode('login'); setError(''); }}
              >
                <ArrowLeft size={14} /> Back to login
              </button>

              <div className="auth-success__icon"><CheckCircle2 size={20} /></div>
              <h2>Check your email</h2>
              <p>We sent a password reset link to <strong>{email}</strong>. Open your inbox and follow the instructions.</p>

              <button type="button" className="auth-btn auth-btn--primary" style={{ width: '100%' }}>
                Open Email App
              </button>
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResetPassword}
                disabled={busy || !email || !isSupabaseConfigured}
              >
                Didn&apos;t receive it? Resend link
              </button>
            </div>
          ) : mode === 'magic-sent' ? (
            <div className="auth-success auth-success--left">
              <button
                type="button"
                className="auth-link-btn auth-link-btn--back"
                onClick={() => { setMode('login'); setError(''); }}
              >
                <ArrowLeft size={14} /> Back to login
              </button>

              <div className="auth-success__icon"><Star size={20} /></div>
              <h2>Magic link sent</h2>
              <p>We sent a sign-in link to <strong>{email}</strong>. Open your inbox to continue.</p>
              <button
                type="button"
                className="auth-btn auth-btn--primary"
                onClick={() => setMode('login')}
                style={{ width: '100%' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <>
              <button
                type="button"
                className="auth-link-btn auth-link-btn--back"
                onClick={() => { setMode('login'); setError(''); }}
              >
                <ArrowLeft size={14} /> Back to login
              </button>

              <h1 className="auth-page__h1">Forgot password?</h1>
              <p className="auth-page__sub">Enter your institutional email and we&apos;ll send a secure reset link.</p>

              {error && <div className="auth-alert auth-alert--error">{error}</div>}

              <div className="auth-field">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                className="auth-btn auth-btn--primary"
                onClick={handleResetPassword}
                disabled={busy || !email || !isSupabaseConfigured}
              >
                {busy ? (
                  <span className="auth-btn__skeleton" aria-hidden="true">
                    <span className="auth-btn__skeleton-dot" />
                    <span className="auth-btn__skeleton-line" />
                  </span>
                ) : 'Send Reset Link'}
              </button>

              <p className="auth-page__legal auth-page__legal--muted">Need help? Contact support for account recovery assistance.</p>
            </>
          ) : (
            <>
              <h1 className="auth-page__h1">Welcome back</h1>
              <p className="auth-page__sub">Knowledge is a curated collection. Sign in to continue your journey.</p>

              {!isSupabaseConfigured && (
                <div className="auth-alert">Supabase not configured — add env vars to enable auth.</div>
              )}
              {error && <div className="auth-alert auth-alert--error">{error}</div>}

              <button
                className="auth-social-btn auth-social-btn--full"
                onClick={() => run(() => signInWithGoogle())}
                disabled={busy || !isSupabaseConfigured}
              >
                <Chrome size={17} />
                Continue with Google
              </button>

              <button
                className="auth-social-btn auth-social-btn--full"
                onClick={handleMagicLink}
                disabled={busy || !email || !isSupabaseConfigured}
              >
                ✨ Send a magic link
              </button>

              <div className="auth-divider"><span>or email access</span></div>

              <div className="auth-field">
                <label>Institutional Email</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field__row">
                  <label>Security Key</label>
                  <button type="button" className="auth-link-btn" onClick={() => setMode('forgot')}>Recover access</button>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="auth-input"
                    autoComplete="current-password"
                  />
                  <button type="button" className="auth-input-eye" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Maintain session for 30 days</span>
              </label>

              <button
                className="auth-btn auth-btn--primary"
                onClick={() => run(() => signInWithPassword(email.trim(), password))}
                disabled={busy || !email || !password || !isSupabaseConfigured}
              >
                {busy ? (
                  <span className="auth-btn__skeleton" aria-hidden="true">
                    <span className="auth-btn__skeleton-dot" />
                    <span className="auth-btn__skeleton-line" />
                  </span>
                ) : 'Access Library'}
              </button>

              <p className="auth-page__switch">
                New to the collection? <Link to="/signup" className="auth-link">Register as curator</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>

      <div className="auth-page__art-side">
        {isRecoveryView ? <RecoveryShowcase /> : <LoginShowcase />}
      </div>
    </div>
  );
}
