import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, BookOpen, Clock, Award, Loader2, AlertCircle } from 'lucide-react';
import useStudy from '../../../state/StudyContext';
import useAuth from '../../../hooks/useAuth';
import useI18n from '../../../hooks/useI18n';
import './PreviewPage.css';

export default function PreviewPage() {
  const navigate = useNavigate();
  const { generatedCards, setSelectedDeck, setGeneratedCards } = useStudy();
  const { accessToken } = useAuth();
  const { t } = useI18n();

  const [deckTitle, setDeckTitle] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const LANGUAGE_OPTIONS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi'];

  // If arrived here without cards, redirect back
  if (!generatedCards || generatedCards.length === 0) {
    navigate('/app/generate', { replace: true });
    return null;
  }

  const previewCards = generatedCards.slice(0, 3);

  const handleStudy = () => {
    setSelectedDeck({ cards: generatedCards, title: deckTitle || t('preview.generatedDeck', 'Generated Deck'), id: 'preview' });
    navigate('/app/study/preview');
  };

  const handleSave = async () => {
    const title = deckTitle.trim() || t('preview.generatedDeck', 'Generated Deck');
    if (!accessToken) {
      setError(t('preview.signInBeforeSaving', 'Please sign in before saving decks.'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, flashcards: generatedCards, languageCode }),
      });
      if (!res.ok) throw new Error(t('preview.failedToSaveDeck', 'Failed to save deck.'));
      setSaved(true);
      setDeckTitle(title);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const estMins = Math.ceil(generatedCards.length * 0.5);

  return (
    <div className="preview-page">
      {/* Badge */}
      <motion.div
        className="preview-badge"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Award size={13} />
        {t('preview.generationComplete', 'GENERATION COMPLETE')}
      </motion.div>

      <motion.h1
        className="preview-h1"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {t('preview.deckReady', 'Your New Deck is Ready')}
      </motion.h1>

      <motion.p
        className="preview-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <strong>{generatedCards.length}</strong> flashcards meticulously crafted from your
        notes - save and start studying now.
      </motion.p>

      {/* Card stack */}
      <motion.div
        className="preview-stack"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.25, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {[...previewCards].reverse().map((card, i) => {
          const realIdx = previewCards.length - 1 - i;
          const isMCQ = card.type === 'mcq';
          return (
            <motion.div
              key={realIdx}
              className={`preview-stack__card preview-stack__card--${realIdx} ${isMCQ ? 'preview-stack__card--mcq' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + realIdx * 0.08 }}
            >
              <span className="preview-stack__card-num">{isMCQ ? '🎯' : '📝'} {t('preview.card', 'Card')} {realIdx + 1}</span>
              <p className="preview-stack__card-q">{card.question || card.front}</p>
              {isMCQ && (
                <div className="preview-stack__card-mcq-hint">
                  <small>{t('preview.multipleChoiceHint', 'Multiple choice • 4 options')}</small>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Meta row */}
      <motion.div
        className="preview-meta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span><Clock size={13} /> {t('preview.estimated', 'Estimated')}: {estMins} {t('preview.minutes', 'min')}{estMins !== 1 ? 's' : ''}</span>
        <span><BookOpen size={13} /> {t('preview.activeRecallMode', 'Active Recall Mode')}</span>
        <span><Award size={13} /> {generatedCards.length} {t('decks.cards', 'cards')}</span>
      </motion.div>

      {/* Title input */}
      <motion.div
        className="preview-save-row"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <input
          className="preview-title-input"
          type="text"
          placeholder={t('preview.nameDeckOptional', 'Name this deck (optional)...')}
          value={deckTitle}
          onChange={(e) => setDeckTitle(e.target.value)}
          disabled={saving}
        />
        <select
          className="preview-language-select"
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          disabled={saving}
          aria-label={t('preview.deckLanguage', 'Deck language')}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
          ))}
        </select>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="preview-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        className="preview-actions"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          className={`preview-btn preview-btn--outline ${saved ? 'preview-btn--saved' : ''}`}
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saving ? <Loader2 size={16} className="preview-spin" /> : <Edit3 size={16} />}
          {saved ? t('preview.saved', 'Saved!') : t('preview.saveDeck', 'Save Deck')}
        </button>
        <button className="preview-btn preview-btn--primary" onClick={handleStudy}>
          <BookOpen size={16} />
          {t('preview.startStudying', 'Start Studying')}
        </button>
      </motion.div>

      <button
        className="preview-back"
        onClick={() => { setGeneratedCards([]); navigate('/app/generate'); }}
      >
        ← {t('preview.generateNewDeck', 'Generate new deck')}
      </button>
    </div>
  );
}
