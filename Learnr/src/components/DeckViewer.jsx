import Flashcard from './Flashcard';

export default function DeckViewer({ deck, onBack }) {
  if (!deck) return null;

  return (
    <div>
      <div className="deck-viewer__header">
        <h2 className="deck-viewer__title">📖 {deck.title}</h2>
        <button className="btn btn--outline btn--sm" onClick={onBack}>
          ← Back to decks
        </button>
      </div>

      <p className="cards-section__title">
        🃏 {deck.flashcards.length} Flashcards — click to flip!
      </p>

      <div className="cards-grid">
        {deck.flashcards.map((card, i) => (
          <Flashcard key={i} front={card.front} back={card.back} index={i} />
        ))}
      </div>
    </div>
  );
}
