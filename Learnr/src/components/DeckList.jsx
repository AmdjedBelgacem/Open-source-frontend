import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import useAuth from '../hooks/useAuth';

export default function DeckList({ onView }) {
  const { showToast } = useToast();
  const { accessToken } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decks', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      setDecks(data.decks || []);
    } catch {
      showToast('Failed to load decks.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setDecks([]);
      setLoading(false);
      return;
    }
    fetchDecks();
  }, [accessToken]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this deck?')) return;
    try {
      await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setDecks((prev) => prev.filter((d) => d.id !== id));
      showToast('Deck deleted.', { type: 'success' });
    } catch {
      showToast('Failed to delete deck.', { type: 'error' });
    }
  };

  const handleView = async (id) => {
    try {
      const res = await fetch(`/api/decks/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      onView(data);
    } catch {
      showToast('Failed to load deck.', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="deck-list deck-list--skeleton" aria-hidden="true">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="deck-item deck-item--skeleton">
            <div className="deck-item__info deck-item__info--skeleton">
              <span className="deck-skeleton-line deck-skeleton-line--title" />
              <span className="deck-skeleton-line deck-skeleton-line--meta" />
            </div>
            <div className="deck-item__actions deck-item__actions--skeleton">
              <span className="deck-skeleton-pill" />
              <span className="deck-skeleton-pill" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📭</div>
        <p className="empty-state__text">No saved decks yet. Generate some flashcards first!</p>
      </div>
    );
  }

  return (
    <div className="deck-list">
      {decks.map((deck) => (
        <div key={deck.id} className="deck-item">
          <div className="deck-item__info">
            <h3>{deck.title}</h3>
            <p className="deck-item__meta">
              {deck.cardCount} cards · {new Date(deck.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="deck-item__actions">
            <button className="btn btn--outline btn--sm" onClick={() => handleView(deck.id)}>
              👁 View
            </button>
            <button className="btn btn--danger btn--sm" onClick={() => handleDelete(deck.id)}>
              🗑 Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
