import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, SkipForward, CheckCircle, Eye, Languages } from 'lucide-react';
import useStudy from '../../../state/StudyContext';
import useAuth from '../../../hooks/useAuth';
import MCQCard from '../../../components/MCQCard';
import useI18n from '../../../hooks/useI18n';
import './StudyPage.css';

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function StudyPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { selectedDeck, setSelectedDeck } = useStudy();
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const [cards, setCards]               = useState([]);
  const [deckTitle, setDeckTitle]       = useState('');
  const [deckLanguageCode, setDeckLanguageCode] = useState('en');
  const [loading, setLoading]           = useState(true);

  const [idx, setIdx]                   = useState(0);
  const [flipped, setFlipped]           = useState(false);
  const [correct, setCorrect]           = useState(0);
  const [incorrect, setIncorrect]       = useState(0);
  const [done, setDone]                 = useState(false);
  const [timer, setTimer]               = useState(0);
  const [streak, setStreak]             = useState({ currentStreak: 0, longestStreak: 0 });
  const [graphPoints, setGraphPoints]   = useState([]);

  const timerRef = useRef(null);
  const eventSentRef = useRef(false);

  // Load deck
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      eventSentRef.current = false;
      if (deckId === 'preview' && selectedDeck) {
        setCards(selectedDeck.cards);
        setDeckTitle(selectedDeck.title || t('study.deck', 'Deck'));
        setDeckLanguageCode('en');
        setLoading(false);
        return;
      }

      if (!accessToken) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`/api/decks/${deckId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) throw new Error('Deck not found');
        const data = await res.json();
        const c = data.flashcards ?? data.cards ?? [];
        setCards(c);
        setDeckTitle(data.title || t('study.deck', 'Deck'));
        setDeckLanguageCode(String(data.languageCode || 'en').toLowerCase());
      } catch {
        navigate('/app/decks', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deckId, selectedDeck, navigate, accessToken, t]);

  // Timer
  useEffect(() => {
    if (loading || done) return;
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, done]);

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([
      fetch('/api/v2/analytics/streak', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load streak.')))),
      fetch('/api/v2/analytics/study-graph?days=7', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load study graph.')))),
    ])
      .then(([streakData, graphData]) => {
        setStreak(streakData || { currentStreak: 0, longestStreak: 0 });
        setGraphPoints(graphData?.points || []);
      })
      .catch(() => {
        setStreak({ currentStreak: 0, longestStreak: 0 });
        setGraphPoints([]);
      });
  }, [accessToken]);

  useEffect(() => {
    if (!done || !accessToken || eventSentRef.current) return;

    const answeredQuestions = correct + incorrect;
    if (answeredQuestions <= 0) return;

    eventSentRef.current = true;
    fetch('/api/v2/analytics/study-event', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionsAnswered: answeredQuestions,
        decksStudied: 1,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to record study event.'))))
      .then((payload) => {
        if (payload?.streak) {
          setStreak(payload.streak);
        }
        return fetch('/api/v2/analytics/study-graph?days=7', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to refresh study graph.'))))
      .then((graphData) => {
        setGraphPoints(graphData?.points || []);
      })
      .catch(() => undefined);
  }, [done, correct, incorrect, accessToken]);

  if (loading) {
    return (
      <div className="study-page study-page--skeleton" aria-hidden="true">
        <div className="study-bar">
          <div className="study-bar__left">
            <span className="study-skeleton-line study-skeleton-line--mode" />
            <span className="study-skeleton-line study-skeleton-line--deck" />
          </div>
          <span className="study-skeleton-pill" />
          <span className="study-skeleton-circle" />
        </div>

        <div className="study-ring-wrap study-ring-wrap--skeleton">
          <span className="study-skeleton-circle study-skeleton-circle--ring" />
          <span className="study-skeleton-line study-skeleton-line--ring-label" />
        </div>

        <div className="study-card-wrap study-card-wrap--skeleton">
          <div className="study-card study-card--skeleton">
            <div className="study-card__face study-card__face--front">
              <span className="study-skeleton-line study-skeleton-line--tag" />
              <span className="study-skeleton-line study-skeleton-line--question" />
              <span className="study-skeleton-line study-skeleton-line--question-short" />
            </div>
          </div>
        </div>

        <div className="study-controls">
          <span className="study-skeleton-btn" />
          <span className="study-skeleton-circle study-skeleton-circle--control" />
          <span className="study-skeleton-btn" />
        </div>

        <div className="study-stats">
          <div className="study-stats__item">
            <span className="study-skeleton-line study-skeleton-line--stat" />
            <span className="study-skeleton-line study-skeleton-line--stat-key" />
          </div>
          <div className="study-stats__item">
            <span className="study-skeleton-line study-skeleton-line--stat" />
            <span className="study-skeleton-line study-skeleton-line--stat-key" />
          </div>
          <div className="study-stats__item">
            <span className="study-skeleton-line study-skeleton-line--stat" />
            <span className="study-skeleton-line study-skeleton-line--stat-key" />
          </div>
        </div>
      </div>
    );
  }

  if (done || cards.length === 0) {
    const total = correct + incorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="study-done">
        <h1 className="study-done__title">{t('study.sessionComplete', 'Session Complete!')}</h1>
        <div className="study-done__ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" className="study-done__ring-bg" />
            <circle
              cx="60" cy="60" r="50"
              className="study-done__ring-fill"
              strokeDasharray={`${(pct / 100) * 314} 314`}
            />
          </svg>
          <span className="study-done__pct">{pct}%</span>
        </div>
        <p className="study-done__sub">
          {correct} correct · {incorrect} missed · {formatTime(timer)}
        </p>

        <div className="study-done__streak-card">
          <div>
            <p className="study-done__streak-label">{t('study.currentStreak', 'Current Streak')}</p>
            <p className="study-done__streak-value">{streak.currentStreak || 0} {t('study.days', 'day')}{(streak.currentStreak || 0) === 1 ? '' : 's'}</p>
          </div>
          <div>
            <p className="study-done__streak-label">{t('study.longest', 'Longest')}</p>
            <p className="study-done__streak-value">{streak.longestStreak || 0}</p>
          </div>
        </div>

        {graphPoints.length > 0 && (
          <div className="study-done__mini-graph" aria-label="Recent study activity graph">
            {graphPoints.map((point) => {
              const height = Math.max(10, Math.min(100, point.questionsAnswered * 8));
              return (
                <div key={point.date} className="study-done__mini-col" title={`${point.date}: ${point.questionsAnswered} questions`}>
                  <span className="study-done__mini-bar" style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
        )}

        <div className="study-done__actions">
          <button className="study-done__btn study-done__btn--secondary" onClick={() => { eventSentRef.current = false; setIdx(0); setFlipped(false); setCorrect(0); setIncorrect(0); setTimer(0); setDone(false); }}>
            {t('study.retry', 'Retry')}
          </button>
          <button className="study-done__btn study-done__btn--primary" onClick={() => navigate('/app/decks')}>
            {t('nav.myDecks', 'My Decks')}
          </button>
        </div>
      </div>
    );
  }

  const card = cards[idx];
  const total = cards.length;
  const progress = Math.round((idx / total) * 100);
  const circum = 2 * Math.PI * 50; // r=50

  const handleFlip = () => setFlipped((f) => !f);

  const next = (wasCorrect) => {
    if (wasCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= total) setDone(true);
      else setIdx((i) => i + 1);
    }, 150);
  };

  const front = card.question || card.front || '';
  const back = card.answer || card.back || '';
  const isMCQ = card.type === 'mcq';

  return (
    <div className="study-page">
      {/* ── Top bar ──────────────────────────────────── */}
      <div className="study-bar">
        <div className="study-bar__left">
          <span className="study-bar__mode">{t('study.studyMode', 'Study Mode')}</span>
          <span className="study-bar__deck">{deckTitle}</span>
          <span className="study-bar__lang"><Languages size={12} /> {deckLanguageCode.toUpperCase()}</span>
        </div>
        <div className="study-bar__streak">
          <Flame size={14} />
          {streak.currentStreak || 0} {t('study.dayStreak', 'Day Streak')}
        </div>
        <button className="study-bar__close" onClick={() => navigate(-1)} aria-label={t('common.close', 'Close')}>
          <X size={18} />
        </button>
      </div>

      {/* ── Progress ring ────────────────────────────── */}
      <div className="study-ring-wrap">
        <svg className="study-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" className="study-ring__bg" />
          <circle
            cx="60" cy="60" r="50"
            className="study-ring__fill"
            strokeDasharray={`${(progress / 100) * circum} ${circum}`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="study-ring__pct">{progress}%</span>
        <span className="study-ring__label">{idx + 1} / {total}</span>
      </div>

      {/* ── Flashcard or MCQ ──────────────────────────── */}
      {isMCQ ? (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <MCQCard
            card={card}
            onAnswer={(wasCorrect) => {
              setTimeout(() => next(wasCorrect), 800);
            }}
          />
        </motion.div>
      ) : (
        <div className="study-card-wrap" onClick={handleFlip}>
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className={`study-card ${flipped ? 'study-card--flipped' : ''}`}>
              <div className="study-card__inner">
                <div className="study-card__face study-card__face--front">
                  <span className="study-card__label">{t('study.question', 'QUESTION')}</span>
                  <p className="study-card__text">{front}</p>
                  {!flipped && (
                    <span className="study-card__tap-hint">{t('study.tapToReveal', 'TAP TO REVEAL ANSWER')}</span>
                  )}
                </div>
                <div className="study-card__face study-card__face--back">
                  <span className="study-card__label study-card__label--back">{t('study.answer', 'ANSWER')}</span>
                  <p className="study-card__text">{back}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Controls (for flip cards only) ────────────── */}
      {!isMCQ && (
        <div className="study-controls">
          <button
            className="study-controls__btn study-controls__btn--skip"
            onClick={() => next(false)}
          >
            <SkipForward size={20} />
            {t('study.skip', 'Skip')}
          </button>
          <button className="study-controls__audio" aria-label={t('study.revealAnswer', 'Reveal answer')} onClick={handleFlip}>
            <Eye size={20} />
          </button>
          <button
            className="study-controls__btn study-controls__btn--correct"
            onClick={() => next(true)}
          >
            <CheckCircle size={20} />
            {t('study.correct', 'Correct')}
          </button>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────── */}
      <div className="study-stats">
        <div className="study-stats__item study-stats__item--green">
          <span className="study-stats__val">{String(correct).padStart(2, '0')}</span>
          <span className="study-stats__key">{t('study.correctLabel', 'CORRECT')}</span>
        </div>
        <div className="study-stats__item">
          <span className="study-stats__val">{String(total - idx - 1).padStart(2, '0')}</span>
          <span className="study-stats__key">{t('study.remaining', 'REMAINING')}</span>
        </div>
        <div className="study-stats__item study-stats__item--cyan">
          <span className="study-stats__val">{formatTime(timer)}</span>
          <span className="study-stats__key">{t('study.timer', 'TIMER')}</span>
        </div>
      </div>
    </div>
  );
}
