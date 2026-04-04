import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import './AuthPages.css';

export default function CallbackPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLightTheme = theme === 'light';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The Supabase auth listener in AuthContext will automatically handle the session
        // We just need to wait a moment for the auth state to update and redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/app/generate');
      } catch (err) {
        setError(err.message || 'Authentication failed. Please try again.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className={`auth-page auth-page--single ${isLightTheme ? 'auth-page--light' : ''}`}>
        <div className="auth-page__form-side auth-page__form-side--centered">
          <div className="auth-page__card auth-success auth-success--left">
            <div className="auth-success__icon">!</div>
            <h2>Authentication Error</h2>
            <p>{error}</p>
          <button
            className="auth-btn auth-btn--primary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className={`auth-page auth-page--single ${isLightTheme ? 'auth-page--light' : ''}`}>
      <div className="auth-page__form-side auth-page__form-side--centered">
        <div className="auth-page__card auth-success auth-success--left">
          <div className="auth-success__icon">✨</div>
          <h2>Signing you in...</h2>
          <p>Please wait while we authenticate your account.</p>
          {loading ? (
            <div className="auth-inline-skeleton" aria-hidden="true">
              <div className="auth-inline-skeleton__line auth-inline-skeleton__line--wide" />
              <div className="auth-inline-skeleton__line" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
