import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import './PricingPage.css';
import Meta from '../../../components/Meta';

const INTERVALS = ['monthly', 'yearly'];

const PLANS = [
  {
    key: 'none',
    label: 'Free',
    description: 'Starter tools for lightweight study sessions.',
    cta: 'Start Free',
    features: ['50 generations / month', 'Core flashcards', 'Basic usage analytics'],
  },
  {
    key: 'premium',
    label: 'Premium',
    description: 'Best for students with heavy weekly study needs.',
    cta: 'Choose Premium',
    monthlyPrice: '$12',
    yearlyPrice: '$9',
    features: ['200 generations / month', 'Priority generation queue', 'Faster import processing'],
  },
  {
    key: 'ultra',
    label: 'Ultra',
    description: 'For power users and exam crunch mode.',
    cta: 'Choose Ultra',
    monthlyPrice: '$29',
    yearlyPrice: '$22',
    features: ['500 generations / month', 'Highest processing priority', 'Advanced export & analytics'],
  },
];

export default function PricingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const inAppShellRoute = location.pathname.startsWith('/app/');

  const [interval, setInterval] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState('');

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      showToast('Checkout complete. Syncing your subscription now.', { type: 'success' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
    if (checkout === 'cancel') {
      showToast('Checkout canceled. No changes were made.', { type: 'info' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  const subtitle = useMemo(() => {
    if (interval === 'yearly') {
      return 'Yearly billing selected. Save compared to monthly.';
    }
    return 'Monthly billing selected. Cancel anytime.';
  }, [interval]);

  const startCheckout = async (tier) => {
    if (tier === 'none') {
      if (isAuthenticated) {
        navigate('/app/generate');
      } else {
        navigate('/signup');
      }
      return;
    }

    if (!isAuthenticated || !accessToken) {
      navigate(`/signup?plan=${tier}&interval=${interval}`);
      return;
    }

    setLoadingPlan(tier);
    try {
      const res = await fetch('/api/v2/billing/checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier, interval }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to start checkout.');
      }

      if (!payload.url) {
        throw new Error('Checkout URL was not returned by the server.');
      }

      window.location.href = payload.url;
    } catch (err) {
      showToast(err.message || 'Failed to start checkout.', { type: 'error' });
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="pricing-page">
      <Meta
        title="Pricing — Learnr"
        description="Plans for individuals and teams. Choose a Learnr plan that fits your study needs." 
        url="https://your-domain.com/pricing"
      />
      {!inAppShellRoute && (
        <header className="pricing-nav">
          <Link to="/" className="pricing-nav__brand">
            <Sparkles size={16} />
            Learnr
          </Link>
          <div className="pricing-nav__actions">
            <Link to={isAuthenticated ? '/app/settings' : '/login'} className="pricing-nav__link">
              {isAuthenticated ? 'Profile' : 'Log In'}
            </Link>
            <Link to={isAuthenticated ? '/app/generate' : '/signup'} className="pricing-nav__btn">
              {isAuthenticated ? 'Open App' : 'Get Started'}
            </Link>
          </div>
        </header>
      )}

      <main className="pricing-main">
        <p className="pricing-kicker">AI CURATION PLANS</p>
        <h1 className="pricing-title">A plan for every curious mind.</h1>
        <p className="pricing-subtitle">{subtitle}</p>

        <div className="pricing-interval" role="tablist" aria-label="Billing interval">
          {INTERVALS.map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={interval === value}
              className={`pricing-interval__tab ${interval === value ? 'pricing-interval__tab--active' : ''}`}
              onClick={() => setInterval(value)}
            >
              {value === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>

        <section className="pricing-grid">
          {PLANS.map((plan) => {
            const isPaid = plan.key !== 'none';
            const price = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <article
                key={plan.key}
                className={`pricing-card ${plan.key === 'premium' ? 'pricing-card--featured' : ''}`}
              >
                {plan.key === 'premium' && <span className="pricing-card__badge">Most Popular</span>}
                <h2>{plan.label}</h2>
                <p className="pricing-card__desc">{plan.description}</p>
                <div className="pricing-card__price-wrap">
                  {isPaid ? (
                    <>
                      <span className="pricing-card__price">{price}</span>
                      <span className="pricing-card__unit">/ month</span>
                    </>
                  ) : (
                    <span className="pricing-card__price">$0</span>
                  )}
                </div>

                <button
                  className="pricing-card__cta"
                  onClick={() => startCheckout(plan.key)}
                  disabled={loadingPlan === plan.key}
                >
                  {loadingPlan === plan.key ? 'Redirecting…' : plan.cta}
                </button>

                <ul className="pricing-card__features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
