import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

export default function AuthPanel() {
  const {
    isSupabaseConfigured,
    loading,
    user,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    sendMagicLink,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const runAction = async (action) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await action();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-panel">
        <p className="auth-panel__meta">Supabase auth is disabled. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="auth-panel auth-panel--skeleton" aria-hidden="true">
        <div className="auth-panel__skeleton-line auth-panel__skeleton-line--wide" />
        <div className="auth-panel__skeleton-line" />
        <div className="auth-panel__skeleton-actions">
          <span className="auth-panel__skeleton-btn" />
          <span className="auth-panel__skeleton-btn" />
          <span className="auth-panel__skeleton-btn" />
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="auth-panel auth-panel--authed">
        <p className="auth-panel__meta">
          Signed in as <strong>{user.email}</strong>
        </p>
        <button className="btn btn--outline btn--sm" onClick={() => runAction(() => signOut())} disabled={busy}>
          Sign Out
        </button>
        {error && <p className="auth-panel__error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <div className="auth-panel__fields">
        <input
          className="auth-panel__input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="auth-panel__input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="auth-panel__actions">
        <button
          className="btn btn--primary btn--sm"
          onClick={() => runAction(() => signInWithPassword(email.trim(), password))}
          disabled={busy || !email || !password}
        >
          Sign In
        </button>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => runAction(() => signUpWithPassword(email.trim(), password))}
          disabled={busy || !email || !password}
        >
          Sign Up
        </button>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => runAction(() => sendMagicLink(email.trim()).then(() => setMessage('Magic link sent. Check your inbox.')))}
          disabled={busy || !email}
        >
          Magic Link
        </button>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => runAction(() => signInWithGoogle())}
          disabled={busy}
        >
          Google
        </button>
      </div>
      {message && <p className="auth-panel__ok">{message}</p>}
      {error && <p className="auth-panel__error">{error}</p>}
    </section>
  );
}
