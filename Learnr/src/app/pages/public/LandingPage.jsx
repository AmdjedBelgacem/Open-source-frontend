import { Link } from 'react-router-dom';
import Meta from '../../../components/Meta';
import { motion } from 'framer-motion';
import { Play, Zap, BookOpen, FlaskConical, ChevronRight } from 'lucide-react';
import './LandingPage.css';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.4,0,0.2,1] } }) };

function NavBar() {
  return (
    <nav className="lp-nav">
      <div className="lp-nav__inner">
        <div className="lp-nav__brand">
          <span>Learnr</span>
        </div>
        <ul className="lp-nav__links">
          <li><a href="#features">Features</a></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><a href="#enterprise">Enterprise</a></li>
        </ul>
        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__link-btn">Log In</Link>
          <Link to="/signup" className="lp-btn lp-btn--primary">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

function FloatingCard({ style, title, subtitle, badge }) {
  return (
    <div className="lp-float-card" style={style}>
      {badge && <span className="lp-float-card__badge">{badge}</span>}
      {title && <p className="lp-float-card__title">{title}</p>}
      {subtitle && <p className="lp-float-card__sub">{subtitle}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="lp">
      <Meta
        title="Learnr — AI flashcards, spaced repetition & study tools"
        description="Learnr helps learners convert raw notes into flashcards, summaries and practice exams using AI and spaced repetition."
        url="https://your-domain.com/"
        image="/og-image.svg"
      />
      <NavBar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__glow" />
        <div className="lp-hero__content">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="lp-hero__pill">
            <Zap size={12} />
            <span>Next-Gen AI Learning</span>
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="lp-hero__h1">
            Paste your notes.<br />
            <span className="lp-hero__h1--grad">Get smarter.</span><br />
            Instantly.
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="lp-hero__sub">
            Learnr uses advanced neural networks to transform your raw lecture notes into structured knowledge, flashcards, and summaries in seconds.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="lp-hero__ctas">
            <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--lg">
              Get Started Free
            </Link>
            <button className="lp-btn lp-btn--ghost lp-btn--lg">
              <Play size={16} />
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* App preview mockup */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="lp-hero__mockup"
        >
          <div className="lp-mockup">
            <div className="lp-mockup__bar">
              <span /><span /><span />
            </div>
            <div className="lp-mockup__body">
              <div className="lp-mockup__sidebar">
                <div className="lp-mockup__row lp-mockup__row--wide" />
                <div className="lp-mockup__row" />
                <div className="lp-mockup__row" />
              </div>
              <div className="lp-mockup__main">
                <div className="lp-mockup__card">
                  <div className="lp-mockup__card-icon"><BookOpen size={20} /></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="lp-features">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="lp-section-header">
          <h2 className="lp-features__h2">Study Smarter, Not Harder</h2>
          <p className="lp-features__sub">Accelerate your learning curve with tools designed by cognitive scientists and powered by state-of-the-art AI.</p>
        </motion.div>
        <div className="lp-features__grid">
          {[
            { icon: <Zap size={22} />, title: 'Instant Summaries', desc: 'Convert 2-hour long lectures into 5-minute concise bullet points without losing the core context.' },
            { icon: <BookOpen size={22} />, title: 'Smart Flashcards', desc: 'Active recall made easy. Automatically generate Q&A pairs from your text using spaced repetition algorithms.' },
            { icon: <FlaskConical size={22} />, title: 'AI Practice Exams', desc: 'Predict what\'s on your test. Generate custom-tailored exams that mimic your professor\'s style.' },
          ].map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" custom={i * 0.1} viewport={{ once: true }} className="lp-feature-card">
              <div className="lp-feature-card__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Band ─────────────────────────────────── */}
      <section className="lp-cta-band">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="lp-cta-band__inner">
          <div className="lp-cta-band__glow" />
          
          <h2>Ready to boost your academic performance?</h2>
          <p>Join over 50,000+ students from top universities worldwide who are already using Learnr to excel in their studies.</p>
          <div className="lp-hero__ctas">
            <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--lg">Get Started for Free</Link>
            <Link to="/pricing" className="lp-btn lp-btn--ghost lp-btn--lg">View Pricing</Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__brand">
          <span>Learnr</span>
        </div>
        <div className="lp-footer__links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#security">Security</a>
          <a href="#contact">Contact Us</a>
        </div>
        <p className="lp-footer__copy">© 2024 Learnr AI. Engineered for excellence.</p>
      </footer>
    </div>
  );
}
