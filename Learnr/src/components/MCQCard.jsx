import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import './MCQCard.css';

export default function MCQCard({ card, onAnswer, disabled = false }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!card || !card.options || card.options.length !== 4) {
    return (
      <div className="mcq-card mcq-card--error">
        <p>Invalid MCQ card format</p>
      </div>
    );
  }

  const isCorrect = selectedIndex === card.correctAnswerIndex;

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    if (onAnswer) {
      onAnswer(isCorrect);
    }
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setSubmitted(false);
  };

  return (
    <div className="mcq-card">
      <div className="mcq-card__question">
        <h3>{card.front}</h3>
      </div>

      <div className="mcq-card__options">
        {card.options.map((option, idx) => {
          let optionClass = 'mcq-card__option';

          if (submitted) {
            if (idx === card.correctAnswerIndex) {
              optionClass += ' mcq-card__option--correct';
            } else if (idx === selectedIndex && !isCorrect) {
              optionClass += ' mcq-card__option--incorrect';
            }
          } else if (idx === selectedIndex) {
            optionClass += ' mcq-card__option--selected';
          }

          return (
            <button
              key={idx}
              className={optionClass}
              onClick={() => !submitted && setSelectedIndex(idx)}
              disabled={submitted || disabled}
            >
              <span className="mcq-card__option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="mcq-card__option-text">{option}</span>
              {submitted && idx === card.correctAnswerIndex && (
                <CheckCircle size={18} className="mcq-card__option-icon" />
              )}
              {submitted && idx === selectedIndex && !isCorrect && (
                <XCircle size={18} className="mcq-card__option-icon" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mcq-card__actions">
        {!submitted ? (
          <button
            className="mcq-card__btn mcq-card__btn--submit"
            onClick={handleSubmit}
            disabled={selectedIndex === null || disabled}
          >
            Submit Answer
          </button>
        ) : (
          <>
            <div className={`mcq-card__result ${isCorrect ? 'mcq-card__result--correct' : 'mcq-card__result--incorrect'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <button className="mcq-card__btn mcq-card__btn--next" onClick={handleReset}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
