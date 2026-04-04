import { useState } from 'react';

export default function FlashcardForm({ onGenerated }) {
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (text.trim().length < 20) {
      setError('Please paste at least 20 characters of notes or article text.');
      return;
    }

    setError('');
    setLoading(true);
    onGenerated([]); // clear previous cards

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), numCards }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed.');
      }

      onGenerated(data.flashcards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <label className="form-card__label" htmlFor="notes-input">
        📝 Paste your notes or article
      </label>
      <textarea
        id="notes-input"
        className="form-card__textarea"
        placeholder="Paste your study material here… (e.g. a Wikipedia article, lecture notes, textbook chapter)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="form-card__row">
        <div className="form-card__number-group">
          <label className="form-card__label" htmlFor="num-cards">
            Cards
          </label>
          <input
            id="num-cards"
            className="form-card__number"
            type="number"
            min={1}
            max={30}
            value={numCards}
            onChange={(e) => setNumCards(Number(e.target.value))}
          />
        </div>

        <button
          className="btn btn--primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <span className="form-btn-skeleton" aria-hidden="true">
              <span className="form-btn-skeleton__dot" />
              <span className="form-btn-skeleton__line" />
            </span>
          ) : (
            '⚡ Generate Flashcards'
          )}
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}
    </div>
  );
}
