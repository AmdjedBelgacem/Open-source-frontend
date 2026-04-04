import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Flame,
  Globe,
  Languages,
  Plus,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Zap,
} from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import LanguageSelectModal from '../../../components/LanguageSelectModal';
import PageHeader from '../../../components/ui/PageHeader';
import EmptyState from '../../../components/ui/EmptyState';
import CardGridSkeleton from '../../../components/ui/CardGridSkeleton';
import './PublicDecksPage.css';
import Meta from '../../../components/Meta';

function languageLabel(code) {
  return String(code || 'en').toUpperCase();
}

function formatCompact(value) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function deckStatus(deck) {
  const score = Number(deck.score || 0);
  const cards = Number(deck.cardCount || 0);
  if (score >= 15) {
    return { label: 'Trending', Icon: Flame, tone: 'hot' };
  }
  if (score >= 6 || cards >= 24) {
    return { label: 'Popular', Icon: Zap, tone: 'gold' };
  }
  return { label: 'Fresh', Icon: Sparkles, tone: 'cool' };
}

function rankDecks(a, b) {
  return (Number(b.score || 0) - Number(a.score || 0)) || (Number(b.cardCount || 0) - Number(a.cardCount || 0));
}

function DeckActions({
  deck,
  votingDeckId,
  copyingId,
  translatingDeckId,
  onVote,
  onCopy,
  onTranslate,
  t,
  compact,
}) {
  return (
    <div className={`public-deck-actions ${compact ? 'public-deck-actions--compact' : ''}`}>
      <div className="public-deck-actions__votes">
        <button
          type="button"
          className={`public-deck-actions__vote-btn ${deck.viewerVote === 1 ? 'public-deck-actions__vote-btn--active-up' : ''}`}
          onClick={() => onVote(deck, 1)}
          disabled={votingDeckId === deck.id}
          aria-busy={votingDeckId === deck.id}
          aria-label="Upvote deck"
        >
          <ThumbsUp size={13} />
        </button>
        <span className="public-deck-actions__score">{Number(deck.score || 0)}</span>
        <button
          type="button"
          className={`public-deck-actions__vote-btn ${deck.viewerVote === -1 ? 'public-deck-actions__vote-btn--active-down' : ''}`}
          onClick={() => onVote(deck, -1)}
          disabled={votingDeckId === deck.id}
          aria-busy={votingDeckId === deck.id}
          aria-label="Downvote deck"
        >
          <ThumbsDown size={13} />
        </button>
      </div>

      <div className="public-deck-actions__cta-row">
        <button
          className={`public-deck-actions__copy-btn ${copyingId === deck.id ? 'public-deck-actions__copy-btn--loading' : ''}`}
          onClick={() => onCopy(deck.id)}
          disabled={copyingId === deck.id || Boolean(deck.alreadyAdded)}
          aria-busy={copyingId === deck.id}
        >
          <Plus size={14} />
          {deck.alreadyAdded ? t('decks.alreadyAdded', 'Already Added') : (copyingId === deck.id ? t('decks.adding', 'Adding...') : t('decks.addToMyDecks', 'Add to My Decks'))}
        </button>
        <button
          type="button"
          className={`public-deck-actions__translate-btn ${translatingDeckId === deck.id ? 'public-deck-actions__translate-btn--loading' : ''}`}
          onClick={() => onTranslate(deck)}
          disabled={translatingDeckId === deck.id}
          aria-busy={translatingDeckId === deck.id}
        >
          <Languages size={14} />
          {translatingDeckId === deck.id ? t('decks.translating', 'Translating...') : t('common.translate', 'Translate')}
        </button>
      </div>
    </div>
  );
}

export default function PublicDecksPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState('for-you');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [decks, setDecks] = useState([]);
  const [copyingId, setCopyingId] = useState('');
  const [votingDeckId, setVotingDeckId] = useState('');
  const [translatingDeckId, setTranslatingDeckId] = useState('');
  const [translateModalDeck, setTranslateModalDeck] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ feed });
    if (languageFilter !== 'all') {
      params.set('languageCode', languageFilter);
    }

    fetch(`/api/public-decks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(t('publicDecks.noPublicDecksFound', 'No public decks found')))))
      .then((payload) => setDecks(payload?.decks || []))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        showToast(err.message || t('publicDecks.noPublicDecksFound', 'No public decks found'), { type: 'error' });
        setDecks([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [accessToken, feed, languageFilter, showToast, t]);

  const availableLanguages = useMemo(
    () => ['all', ...Array.from(new Set(decks.map((d) => String(d.languageCode || 'en').toLowerCase())))],
    [decks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter((deck) => {
      const title = String(deck.title || '').toLowerCase();
      const author = String(deck.author?.displayName || '').toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [decks, query]);

  const feedStats = useMemo(() => {
    const totalVotes = decks.reduce((sum, deck) => sum + Number(deck.score || 0), 0);
    const totalCards = decks.reduce((sum, deck) => sum + Number(deck.cardCount || 0), 0);
    return {
      deckCount: decks.length,
      totalVotes,
      totalCards,
    };
  }, [decks]);

  const topCreators = useMemo(() => {
    const byAuthor = new Map();
    decks.forEach((deck) => {
      const id = deck.author?.id || deck.author?.displayName || 'unknown';
      const current = byAuthor.get(id) || {
        id,
        name: deck.author?.displayName || 'Learner',
        avatarUrl: deck.author?.avatarUrl || '',
        decks: 0,
        score: 0,
      };
      current.decks += 1;
      current.score += Number(deck.score || 0);
      byAuthor.set(id, current);
    });

    return Array.from(byAuthor.values())
      .sort((a, b) => (b.score - a.score) || (b.decks - a.decks))
      .slice(0, 7);
  }, [decks]);

  const trendingLanguages = useMemo(() => {
    const counts = new Map();
    decks.forEach((deck) => {
      const code = String(deck.languageCode || 'en').toLowerCase();
      counts.set(code, (counts.get(code) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [decks]);

  const spotlightDeck = useMemo(() => {
    if (filtered.length === 0) return null;
    const ranked = [...filtered].sort(rankDecks);
    return ranked[0] || null;
  }, [filtered]);

  const mosaicDecks = useMemo(() => {
    if (!spotlightDeck) return filtered;
    return filtered.filter((deck) => deck.id !== spotlightDeck.id).sort(rankDecks);
  }, [filtered, spotlightDeck]);

  const copyDeck = async (deckId) => {
    if (!accessToken || copyingId) return;
    setCopyingId(deckId);
    try {
      const res = await fetch(`/api/public-decks/${deckId}/copy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 || payload.code === 'already_added') {
          setDecks((prev) => prev.map((deck) => (
            deck.id === deckId ? { ...deck, alreadyAdded: true } : deck
          )));
          showToast(t('decks.alreadyAddedToast', 'Already added to your library.'), { type: 'info' });
          return;
        }
        throw new Error(payload.error || 'Failed to copy deck.');
      }

      setDecks((prev) => prev.map((deck) => (
        deck.id === deckId ? { ...deck, alreadyAdded: true } : deck
      )));
      showToast(t('decks.addToMyDecks', 'Add to My Decks'), { type: 'success' });
      navigate('/app/decks');
    } catch (err) {
      showToast(err.message || 'Failed to copy deck.', { type: 'error' });
    } finally {
      setCopyingId('');
    }
  };

  const voteDeck = async (deck, direction) => {
    if (!accessToken || votingDeckId) return;
    const nextVote = deck.viewerVote === direction ? 0 : direction;
    setVotingDeckId(deck.id);
    try {
      const res = await fetch(`/api/public-decks/${deck.id}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: nextVote }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to submit vote.');
      }

      setDecks((prev) => prev.map((item) => (
        item.id === deck.id
          ? {
              ...item,
              score: payload.score,
              upvotes: payload.upvotes,
              downvotes: payload.downvotes,
              viewerVote: payload.viewerVote,
            }
          : item
      )));
    } catch (err) {
      showToast(err.message || 'Failed to submit vote.', { type: 'error' });
    } finally {
      setVotingDeckId('');
    }
  };

  const translateDeck = async (targetLanguageCode) => {
    if (!accessToken || translatingDeckId) return;
    if (!targetLanguageCode || !translateModalDeck) return;
    const sourceDeck = translateModalDeck;

    setTranslatingDeckId(sourceDeck.id);
    try {
      const res = await fetch(`/api/decks/${sourceDeck.id}/translate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetLanguageCode }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || t('decks.translationFailed', 'Failed to translate deck.'));
      }

      if (payload?.reusedOriginal && payload?.deck?.id) {
        showToast(t('decks.reusedOriginalDeck', 'Deck already in that language. Using original deck.'), { type: 'info' });
        navigate(`/app/study/${payload.deck.id}`);
        return;
      }

      if (payload?.deck?.id) {
        showToast(payload.alreadyTranslated ? t('decks.existingTranslatedDeck', 'Using your existing translated deck.') : t('decks.translatedDeckCreated', 'Translated deck created.'), { type: 'success' });
        navigate(`/app/study/${payload.deck.id}`);
      }
    } catch (err) {
      showToast(err.message || t('decks.translationFailed', 'Failed to translate deck.'), { type: 'error' });
    } finally {
      setTranslatingDeckId('');
      setTranslateModalDeck(null);
    }
  };

  return (
    <div className="public-decks-page public-decks-page--atlas">
      <Meta
        title="Public Decks — Learnr"
        description="Discover community-shared flashcard decks on Learnr. Copy decks into your library and start studying." 
        url="https://your-domain.com/app/public-decks"
      />
      <section className="public-decks-hero">
        <PageHeader
          title={t('publicDecks.title', 'Public Decks')}
          subtitle={t('publicDecks.subtitle', 'Discover high quality decks shared by the community and copy them into your own library.')}
          actions={(
            <>
              <div className="public-decks-hero__badge">
                <Globe size={14} />
                {t('publicDecks.communityLibrary', 'Community Library')}
              </div>
              <button type="button" className="public-decks-hero__my-btn" onClick={() => navigate('/app/decks')}>
                <Plus size={13} />
                My Decks
              </button>
            </>
          )}
        />

        <div className="public-decks-hero__kpis" aria-label="Public decks overview">
          <div className="public-decks-kpi">
            <span>{t('publicDecks.title', 'Public Decks')}</span>
            <strong>{formatCompact(feedStats.deckCount)}</strong>
          </div>
          <div className="public-decks-kpi">
            <span>Cards</span>
            <strong>{formatCompact(feedStats.totalCards)}</strong>
          </div>
          <div className="public-decks-kpi">
            <span>Score</span>
            <strong>{formatCompact(feedStats.totalVotes)}</strong>
          </div>
        </div>
      </section>

      <section className="public-decks-command" aria-label="Public decks controls">
        <div className="public-decks-search">
          <Search size={15} />
          <input
            type="text"
            placeholder={t('publicDecks.searchDecksOrAuthors', 'Search decks or authors...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="public-decks-command__row">
          <div className="public-decks-feed-tabs" role="tablist" aria-label="Public deck feed tabs">
            <button
              type="button"
              role="tab"
              aria-selected={feed === 'for-you'}
              className={`public-decks-feed-tab ${feed === 'for-you' ? 'public-decks-feed-tab--active' : ''}`}
              onClick={() => setFeed('for-you')}
            >
              {t('publicDecks.forYou', 'For You')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={feed === 'following'}
              className={`public-decks-feed-tab ${feed === 'following' ? 'public-decks-feed-tab--active' : ''}`}
              onClick={() => setFeed('following')}
            >
              {t('publicDecks.following', 'Following')}
            </button>
          </div>

          <select
            className="public-decks-language-filter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            aria-label="Filter public decks by language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang === 'all' ? t('decks.allLanguages', 'All languages') : languageLabel(lang)}</option>
            ))}
          </select>
        </div>

        <p className="public-decks-command__count">Showing {filtered.length} decks</p>
      </section>

      {loading ? (
        <section className="public-decks-loading" aria-label={t('common.loading', 'Loading...')}>
          <div className="public-decks-loading__spotlight" />
          <CardGridSkeleton className="public-decks-loading__grid" count={6} />
        </section>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="public-decks-empty"
          icon={<Globe size={36} />}
          title={t('publicDecks.noPublicDecksFound', 'No public decks found')}
          description={feed === 'following' ? t('publicDecks.followMoreLearners', 'Follow more learners to build your Following feed.') : t('publicDecks.tryAnotherSearch', 'Try another search or check back later.')}
        />
      ) : (
        <div className="public-decks-stage">
          {spotlightDeck && (
            <article className="public-decks-spotlight">
              <div className="public-decks-spotlight__media">
                {spotlightDeck.thumbnailUrl ? (
                  <img src={spotlightDeck.thumbnailUrl} alt="Deck thumbnail" loading="lazy" decoding="async" />
                ) : (
                  <div className="public-decks-spotlight__media-fallback"><Globe size={24} /></div>
                )}
              </div>

              <div className="public-decks-spotlight__body">
                {(() => {
                  const badge = deckStatus(spotlightDeck);
                  return (
                    <div className={`public-decks-status public-decks-status--${badge.tone}`}>
                      <badge.Icon size={13} />
                      {badge.label}
                    </div>
                  );
                })()}

                <span className="public-decks-spotlight__language">{languageLabel(spotlightDeck.languageCode)}</span>
                <h2>{spotlightDeck.title}</h2>
                <p>
                  {spotlightDeck.description || spotlightDeck.sourceText?.slice(0, 220) || 'Carefully curated flashcards from the community library.'}
                </p>

                <div className="public-decks-spotlight__meta">
                  <span>{spotlightDeck.cardCount || 0} cards</span>
                  <button
                    type="button"
                    className="public-decks-author-link"
                    onClick={() => navigate(`/app/profile/${spotlightDeck.author?.id}`)}
                    disabled={!spotlightDeck.author?.id}
                  >
                    <UserRound size={13} />
                    {spotlightDeck.author?.displayName || 'Learner'}
                    <ArrowUpRight size={13} />
                  </button>
                </div>

                <DeckActions
                  deck={spotlightDeck}
                  votingDeckId={votingDeckId}
                  copyingId={copyingId}
                  translatingDeckId={translatingDeckId}
                  onVote={voteDeck}
                  onCopy={copyDeck}
                  onTranslate={setTranslateModalDeck}
                  t={t}
                />
              </div>
            </article>
          )}

          <section className="public-decks-radar" aria-label="Top creators">
            <h3>Creator Radar</h3>
            <ul>
              {topCreators.length === 0 ? (
                <li className="public-decks-radar__empty">No creator data yet.</li>
              ) : (
                topCreators.map((creator) => (
                  <li key={creator.id}>
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.name} loading="lazy" decoding="async" />
                    ) : (
                      <span className="public-decks-radar__avatar-fallback"><UserRound size={13} /></span>
                    )}
                    <strong>{creator.name}</strong>
                    <small>{creator.decks} decks</small>
                    <b>{creator.score}</b>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="public-decks-mosaic" aria-label="Public deck cards">
            {mosaicDecks.map((deck, index) => {
              const badge = deckStatus(deck);
              return (
                <article key={deck.id} className={`public-decks-tile ${index % 5 === 0 ? 'public-decks-tile--featured' : ''}`}>
                  <div className="public-decks-tile__head">
                    <span className={`public-decks-status public-decks-status--${badge.tone}`}>
                      <badge.Icon size={12} />
                      {badge.label}
                    </span>
                    <span className="public-decks-tile__language">{languageLabel(deck.languageCode)}</span>
                  </div>

                  <h4>{deck.title}</h4>
                  <p>{deck.description || deck.sourceText?.slice(0, 132) || 'Carefully curated flashcards from the community library.'}</p>

                  <div className="public-decks-tile__meta">
                    <span>{deck.cardCount || 0} cards</span>
                    <button
                      type="button"
                      className="public-decks-author-link"
                      onClick={() => navigate(`/app/profile/${deck.author?.id}`)}
                      disabled={!deck.author?.id}
                    >
                      <UserRound size={13} />
                      {deck.author?.displayName || 'Learner'}
                    </button>
                  </div>

                  <DeckActions
                    deck={deck}
                    votingDeckId={votingDeckId}
                    copyingId={copyingId}
                    translatingDeckId={translatingDeckId}
                    onVote={voteDeck}
                    onCopy={copyDeck}
                    onTranslate={setTranslateModalDeck}
                    t={t}
                    compact
                  />
                </article>
              );
            })}
          </section>

          <section className="public-decks-language-cloud" aria-label="Trending languages">
            <h3>Trending Languages</h3>
            <div>
              {trendingLanguages.length === 0 ? (
                <span className="public-decks-language-cloud__empty">No languages yet.</span>
              ) : (
                trendingLanguages.map(([code, count]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguageFilter(code)}
                    className={languageFilter === code ? 'public-decks-language-cloud__chip public-decks-language-cloud__chip--active' : 'public-decks-language-cloud__chip'}
                  >
                    {languageLabel(code)}
                    <b>{count}</b>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <LanguageSelectModal
        open={Boolean(translateModalDeck)}
        title={t('decks.chooseTranslateLanguage', 'Choose translation language')}
        subtitle={t('decks.chooseTranslateLanguageSubtitle', 'Create a translated copy of this deck in your library.')}
        sourceLanguageCode={translateModalDeck?.languageCode || 'en'}
        onClose={() => setTranslateModalDeck(null)}
        onSelect={translateDeck}
      />
    </div>
  );
}
