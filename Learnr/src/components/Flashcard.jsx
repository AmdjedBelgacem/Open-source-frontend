import { useState } from 'react';

export default function Flashcard({ front, back, index }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard ${index + 1}: ${flipped ? 'showing answer' : 'showing question'}`}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
    >
      <div className="flashcard__inner">
        {/* Front */}
        <div className="flashcard__face flashcard__front">
          <span className="flashcard__badge">Q{index + 1}</span>
          <p className="flashcard__text">{front}</p>
          <span className="flashcard__hint">tap to reveal ↻</span>
        </div>

        {/* Back */}
        <div className="flashcard__face flashcard__back">
          <span className="flashcard__badge">Answer</span>
          <p className="flashcard__text">{back}</p>
          <span className="flashcard__hint">tap to flip back ↻</span>
        </div>
      </div>
    </div>
  );
}
