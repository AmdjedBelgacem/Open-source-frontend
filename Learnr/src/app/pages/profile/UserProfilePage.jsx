import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid2x2, List, Plus, UserRound } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import EmptyState from '../../../components/ui/EmptyState';
import CardGridSkeleton from '../../../components/ui/CardGridSkeleton';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [publicDecks, setPublicDecks] = useState([]);
  const [followBusy, setFollowBusy] = useState(false);
  const [copyingId, setCopyingId] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (!accessToken || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/v2/profile/public/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile.')))),
      fetch(`/api/public-decks?authorId=${encodeURIComponent(userId)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load public decks.')))),
    ])
      .then(([profilePayload, decksPayload]) => {
        setProfile(profilePayload);
        setPublicDecks(decksPayload?.decks || []);
      })
      .catch((err) => {
        showToast(err.message || 'Failed to load public profile.', { type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [accessToken, userId, showToast]);

  const followLabel = useMemo(() => {
    if (!profile || profile.isSelf) return '';
    return profile.isFollowing ? 'Unfollow' : 'Follow';
  }, [profile]);

  const toggleFollow = async () => {
    if (!accessToken || !profile || profile.isSelf || followBusy) return;
    setFollowBusy(true);
    try {
      const endpoint = `/api/v2/social/follow/${profile.user.id}`;
      const method = profile.isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to update follow state.');
      }

      setProfile((prev) => {
        if (!prev) return prev;
        const nextFollowing = !prev.isFollowing;
        const nextFollowers = Math.max(0, (prev.stats?.followers || 0) + (nextFollowing ? 1 : -1));
        return {
          ...prev,
          isFollowing: nextFollowing,
          stats: {
            ...prev.stats,
            followers: nextFollowers,
          },
        };
      });
    } catch (err) {
      showToast(err.message || 'Failed to update follow state.', { type: 'error' });
    } finally {
      setFollowBusy(false);
    }
  };

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
        throw new Error(payload.error || 'Failed to copy deck.');
      }

      showToast('Deck copied to your library.', { type: 'success' });
      navigate('/app/decks');
    } catch (err) {
      showToast(err.message || 'Failed to copy deck.', { type: 'error' });
    } finally {
      setCopyingId('');
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page" aria-hidden="true">
        <section className="user-profile-hero user-profile-hero--skeleton sb-skeleton">
          <div className="user-profile-hero__skeleton-avatar sb-skeleton" />
          <div className="user-profile-hero__skeleton-copy">
            <div className="user-profile-hero__skeleton-line user-profile-hero__skeleton-line--title sb-skeleton" />
            <div className="user-profile-hero__skeleton-line sb-skeleton" />
            <div className="user-profile-hero__skeleton-line user-profile-hero__skeleton-line--short sb-skeleton" />
          </div>
        </section>
        <CardGridSkeleton className="user-profile-page__skeleton-grid" count={6} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-page">
        <EmptyState
          icon={<UserRound size={32} />}
          title="Profile not found"
          description="This profile may be private or unavailable right now."
        />
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <section className="user-profile-hero">
        <div className="user-profile-hero__identity">
          <div className="user-profile-hero__avatar-wrap">
            {profile.user.avatarUrl ? (
              <img src={profile.user.avatarUrl} alt="Profile avatar" className="user-profile-hero__avatar" loading="lazy" decoding="async" />
            ) : (
              <span className="user-profile-hero__avatar user-profile-hero__avatar--fallback"><UserRound size={20} /></span>
            )}
            <span className="user-profile-hero__tier">{String(profile.user.subscriptionTier || 'standard').toUpperCase()}</span>
          </div>

          <div className="user-profile-hero__meta">
            <h1>{profile.user.displayName}</h1>
            <p>Digital curator exploring design, language, and neural learning systems.</p>

            <div className="user-profile-hero__stats">
              <div><strong>{profile.stats.publicDecks || 0}</strong><span>Public Decks</span></div>
              <div><strong>{profile.stats.followers || 0}</strong><span>Followers</span></div>
              <div><strong>{profile.stats.following || 0}</strong><span>Following</span></div>
            </div>
          </div>
        </div>

        {!profile.isSelf ? (
          <button className="user-profile-hero__follow-btn" onClick={toggleFollow} disabled={followBusy}>
            {followBusy ? 'Please wait...' : followLabel}
          </button>
        ) : (
          <button className="user-profile-hero__follow-btn" onClick={() => navigate('/app/settings')}>
            Open Settings
          </button>
        )}
      </section>

      <section className="user-profile-decks">
        <div className="user-profile-decks__head">
          <h2>Public Decks</h2>
          <div className="user-profile-decks__view-switch">
            <button
              type="button"
              className={viewMode === 'grid' ? 'user-profile-decks__view-btn user-profile-decks__view-btn--active' : 'user-profile-decks__view-btn'}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid2x2 size={13} />
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'user-profile-decks__view-btn user-profile-decks__view-btn--active' : 'user-profile-decks__view-btn'}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={13} />
            </button>
          </div>
        </div>

        {publicDecks.length === 0 ? (
          <p className="user-profile-decks__empty">No public decks yet.</p>
        ) : (
          <div className={`user-profile-decks__grid ${viewMode === 'list' ? 'user-profile-decks__grid--list' : ''}`}>
            {publicDecks.map((deck) => (
              <article key={deck.id} className="user-profile-deck-card">
                <div className="user-profile-deck-card__cover">
                  {deck.thumbnailUrl ? <img src={deck.thumbnailUrl} alt={deck.title} loading="lazy" decoding="async" /> : <span>{deck.title?.slice(0, 1) || 'D'}</span>}
                  <small>{String(deck.languageCode || 'EN').toUpperCase()}</small>
                </div>
                <div className="user-profile-deck-card__body">
                  <h3>{deck.title}</h3>
                  <p>{deck.description || 'Curated deck designed for focused and high-retention study sessions.'}</p>
                  <div className="user-profile-deck-card__meta">
                    <span>{deck.cardCount || 0} Cards</span>
                    <span>{Math.max(1, Math.round((deck.cardCount || 0) / 3))} Learners</span>
                  </div>
                </div>
                {!profile.isSelf && (
                  <button onClick={() => copyDeck(deck.id)} disabled={copyingId === deck.id}>
                    <Plus size={13} />
                    {copyingId === deck.id ? 'Adding...' : 'Add to My Decks'}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
