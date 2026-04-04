import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Chrome, Wand2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import './AuthPages.css';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function SignupShowcase() {
  return (
    <div className="auth-showcase auth-showcase--signup">
      <span className="auth-showcase__concept-pill">Neural curation v2.0</span>
      <h2>Transform notes into <span>active memory.</span></h2>
      <p>
        Learnr leverages advanced language models to synthesize your lectures into high-retention flashcard decks in seconds.
      </p>

      <div className="auth-showcase__feature-grid">
        <div>
          <strong>AI Synthesis</strong>
          <small>Automated concept extraction from long-form text.</small>
        </div>
        <div>
          <strong>Spaced Repetition</strong>
          <small>Optimized review cycles based on cognitive load.</small>
        </div>
      </div>

      <div className="auth-showcase__board" />
      <div className="auth-showcase__board-pill">40k+ students enrolled</div>
    </div>
  );
}

function SignupCheckEmailShowcase() {
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

function PasswordStep({
  email,
  showPass,
  showConfirm,
  setShowPass,
  setShowConfirm,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  busy,
  error,
  setMode,
  setError,
  handleSignupWithPassword,
  isSupabaseConfigured,
}) {
  return (
    <>
      <button
        type="button"
        className="auth-link-btn auth-link-btn--back"
        onClick={() => { setMode('oauth'); setError(''); }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="auth-page__h1">Set your security key</h1>
      <p className="auth-page__sub">Create a password to finalize your curator account.</p>

      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <div className="auth-field">
        <label>Institutional Email</label>
        <div className="auth-input-wrap">
          <Mail size={15} className="auth-input-icon" />
          <input type="email" value={email} disabled className="auth-input" />
        </div>
      </div>

      <div className="auth-field">
        <label>Security Key</label>
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
      </div>

      <div className="auth-field">
        <label>Confirm Security Key</label>
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
        onClick={handleSignupWithPassword}
        disabled={busy || !password || !confirmPassword || !isSupabaseConfigured}
      >
        {busy ? (
          <span className="auth-btn__skeleton" aria-hidden="true">
            <span className="auth-btn__skeleton-dot" />
            <span className="auth-btn__skeleton-line" />
          </span>
        ) : 'Create Account'}
      </button>
    </>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUpWithPassword, signInWithGoogle, sendMagicLink, isSupabaseConfigured } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('oauth');
  const [error, setError] = useState('');

  const isLightTheme = theme === 'light';
  const useLightLayout = isLightTheme || mode === 'magic-sent';

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      navigate('/app/generate');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignupWithPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    await run(() => signUpWithPassword(email.trim(), password));
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

  const handleContinueWithEmail = () => {
    if (!email.trim()) return;
    setMode('password');
    setError('');
  };

  return (
    <div className={`auth-page ${useLightLayout ? 'auth-page--light' : ''}`}>
      <div className="auth-page__form-side">
        <Link to="/" className={`auth-page__brand ${useLightLayout ? 'auth-page__brand--dark' : ''}`}>
          <div className="auth-page__brand-logo"><Sparkles size={16} /></div>
          <span>Learnr</span>
        </Link>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className={`auth-page__card ${mode === 'magic-sent' ? 'auth-page__card--recovery' : ''}`}>
          {mode === 'magic-sent' ? (
            <div className="auth-success auth-success--left">
              <button
                type="button"
                className="auth-link-btn auth-link-btn--back"
                onClick={() => { setMode('oauth'); setError(''); }}
              >
                <ArrowLeft size={14} /> Back to login
              </button>

              <div className="auth-success__icon"><CheckCircle2 size={20} /></div>
              <h2>Check your email</h2>
              <p>We&apos;ve sent a secure sign-in link to <strong>{email}</strong>. Check your inbox and follow the instructions.</p>
              <button type="button" className="auth-btn auth-btn--primary" style={{ width: '100%' }}>
                Open Email App
              </button>
              <button type="button" className="auth-link-btn" onClick={handleMagicLink} disabled={busy || !isSupabaseConfigured}>
                Didn&apos;t receive it? Resend
              </button>
            </div>
          ) : mode === 'password' ? (
            <PasswordStep
              email={email}
              showPass={showPass}
              showConfirm={showConfirm}
              setShowPass={setShowPass}
              setShowConfirm={setShowConfirm}
              password={password}
              confirmPassword={confirmPassword}
              setPassword={setPassword}
              setConfirmPassword={setConfirmPassword}
              busy={busy}
              error={error}
              setError={setError}
              setMode={setMode}
              handleSignupWithPassword={handleSignupWithPassword}
              isSupabaseConfigured={isSupabaseConfigured}
            />
          ) : (
            <>
              <p className="auth-page__switch" style={{ marginBottom: 0, textAlign: 'right' }}>
                Already a member? <Link to="/login" className="auth-link">Sign in</Link>
              </p>

              <h1 className="auth-page__h1">Begin your journey.</h1>
              <p className="auth-page__sub">Join the vanguard of digital scholars.</p>

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

              <div className="auth-divider"><span>or use magic link</span></div>

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

              <button
                className="auth-btn auth-btn--secondary"
                onClick={handleContinueWithEmail}
                disabled={busy || !email || !isSupabaseConfigured}
              >
                Continue with Email
              </button>

              <button
                className="auth-social-btn auth-social-btn--full"
                onClick={handleMagicLink}
                disabled={busy || !email || !isSupabaseConfigured}
              >
                <Wand2 size={17} />
                Send Magic Link
              </button>

              <p className="auth-page__legal">
                By creating an account you consent to our{' '}
                <a href="#tos" className="auth-link">Terms of Service</a> and{' '}
                <a href="#privacy" className="auth-link">Privacy Policy</a>.
              </p>
            </>
          )}
        </motion.div>
      </div>

      <div className="auth-page__art-side">
        {mode === 'magic-sent' ? <SignupCheckEmailShowcase /> : <SignupShowcase />}
      </div>
    </div>
  );
}
