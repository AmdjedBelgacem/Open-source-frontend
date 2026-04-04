import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, GraduationCap, Clock, Pencil, Trash2, Globe, Lock, Languages } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import LanguageSelectModal from '../../../components/LanguageSelectModal';
import PageHeader from '../../../components/ui/PageHeader';
import StatTile from '../../../components/ui/StatTile';
import EmptyState from '../../../components/ui/EmptyState';
import CardGridSkeleton from '../../../components/ui/CardGridSkeleton';
import './DecksPage.css';

const SORTS = ['Recent', 'Popular', 'A–Z'];

const SUBJECT_COLORS = [
  { bg: 'rgba(124,58,237,0.25)', border: 'rgba(124,58,237,0.4)', color: '#A855F7' },
  { bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.35)', color: '#22D3EE' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#10B981' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#F59E0B' },
  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  color: '#EF4444' },
];

function relativeDate(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function languageLabel(code) {
  const c = String(code || 'en').toLowerCase();
  return c.toUpperCase();
}

export default function DecksPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [decks, setDecks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [sort, setSort]       = useState('Recent');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [editingDeck, setEditingDeck] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSourceText, setEditSourceText] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState('');
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [translatingDeckId, setTranslatingDeckId] = useState('');
  const [translateModalDeck, setTranslateModalDeck] = useState(null);
  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      setDecks([]);
      setLoading(false);
      return;
    }

    fetch('/api/decks', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setDecks(Array.isArray(data) ? data : (data?.decks ?? [])))
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const availableLanguages = useMemo(
    () => ['all', ...Array.from(new Set(decks.map((d) => String(d.languageCode || 'en').toLowerCase())))],
    [decks],
  );

  const filtered = useMemo(
    () => decks
      .filter((d) => d.title?.toLowerCase().includes(query.toLowerCase()))
      .filter((d) => languageFilter === 'all' || String(d.languageCode || 'en').toLowerCase() === languageFilter)
      .sort((a, b) => {
        if (sort === 'A–Z') return a.title.localeCompare(b.title);
        if (sort === 'Popular') return (b.cardCount ?? 0) - (a.cardCount ?? 0);
        return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
      }),
    [decks, languageFilter, query, sort],
  );

  const totalCards = decks.reduce((sum, deck) => sum + (deck.cardCount ?? deck.flashcards?.length ?? 0), 0);
  const publicDecks = decks.filter((deck) => deck.isPublic).length;
  const privateDecks = Math.max(0, decks.length - publicDecks);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const handleDeleteDeck = async () => {
    if (!accessToken || !deletingDeck) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/decks/${deletingDeck.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to delete deck.');
      }
      setDecks((prev) => prev.filter((d) => d.id !== deletingDeck.id));
      showToast('Deck deleted.', { type: 'success' });
      setDeletingDeck(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete deck.', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (deck) => {
    setEditingDeck(deck);
    setEditTitle(deck.title || '');
    setEditSourceText(deck.sourceText || '');
    setEditIsPublic(Boolean(deck.isPublic));
    setEditThumbnailFile(null);
    setEditThumbnailPreview(deck.thumbnailUrl || '');
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingDeck(null);
    setEditTitle('');
    setEditSourceText('');
    setEditIsPublic(false);
    setEditThumbnailFile(null);
    setEditThumbnailPreview('');
    setThumbnailDragOver(false);
  };

  const setThumbnailFromFile = (file) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Thumbnail must be JPEG, PNG, or WEBP.', { type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Thumbnail exceeds 5MB limit.', { type: 'error' });
      return;
    }

    setEditThumbnailFile(file);
    setEditThumbnailPreview(URL.createObjectURL(file));
  };

  const handleThumbnailFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setThumbnailFromFile(file);
  };

  const handleThumbnailDrop = (event) => {
    event.preventDefault();
    setThumbnailDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    setThumbnailFromFile(file);
  };

  const handleEditDeck = async () => {
    if (!accessToken || !editingDeck) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      showToast('Deck title cannot be empty.', { type: 'error' });
      return;
    }

    setSavingEdit(true);
    try {
      let thumbnailPayload = null;
      if (editThumbnailFile) {
        const base64Data = await fileToBase64(editThumbnailFile);
        const uploadRes = await fetch(`/api/decks/${editingDeck.id}/thumbnail`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mimeType: editThumbnailFile.type,
            fileName: editThumbnailFile.name,
            base64Data,
          }),
        });
        thumbnailPayload = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(thumbnailPayload.error || 'Failed to upload thumbnail.');
        }
      }

      const res = await fetch(`/api/decks/${editingDeck.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: trimmedTitle,
          sourceText: editSourceText,
          isPublic: editIsPublic,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to update deck.');
      }

      const mergedPayload = {
        ...payload,
        ...(thumbnailPayload || {}),
      };

      setDecks((prev) => prev.map((d) => (d.id === editingDeck.id ? { ...d, ...mergedPayload } : d)));
      showToast('Deck updated.', { type: 'success' });
      closeEditModal();
    } catch (err) {
      showToast(err.message || 'Failed to update deck.', { type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTranslateDeck = async (deck, targetLanguageCode) => {
    if (!accessToken || translatingDeckId) return;

    setTranslatingDeckId(deck.id);
    try {
      const res = await fetch(`/api/decks/${deck.id}/translate`, {
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
      } else {
        showToast(t('decks.translatedDeckCreated', 'Translated deck created.'), { type: 'success' });
      }
    } catch (err) {
      showToast(err.message || t('decks.translationFailed', 'Failed to translate deck.'), { type: 'error' });
    } finally {
      setTranslatingDeckId('');
      setTranslateModalDeck(null);
    }
  };

  return (
    <div className="decks-page">
      <section className="decks-hero">
        <PageHeader
          title={t('decks.library', 'My Decks')}
          subtitle={t('decks.manageDecks', 'Manage, organize, and study your personal deck library')}
          actions={(
            <>
              <button className="decks-header__ghost-btn" onClick={() => navigate('/app/public-decks')}>
                <Globe size={14} />
                {t('publicDecks.title', 'Public Decks')}
              </button>
              <button className="decks-header__new-btn" onClick={() => navigate('/app/generate')}>
                <Plus size={15} />
                {t('decks.newDeck', 'New Deck')}
              </button>
            </>
          )}
        />
      </section>

      <section className="decks-kpi-row" aria-label="Library overview">
        <StatTile label="Total Decks" value={decks.length} />
        <StatTile label="Total Cards" value={totalCards} />
        <StatTile label="Public Decks" value={publicDecks} />
        <StatTile label="Private Decks" value={privateDecks} />
      </section>

      <div className="decks-toolbar-wrap">
        <div className="decks-toolbar-title">Deck Controls</div>
        <div className="decks-toolbar">
          <div className="decks-search">
            <Search size={15} className="decks-search__icon" />
            <input
              className="decks-search__input"
              type="text"
              placeholder={t('decks.searchDecks', 'Search decks...')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="decks-sorts">
            {SORTS.map((s) => (
              <button
                key={s}
                className={`decks-sort-pill ${sort === s ? 'decks-sort-pill--active' : ''}`}
                onClick={() => setSort(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            className="decks-language-filter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            aria-label="Filter decks by language"
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang === 'all' ? t('decks.allLanguages', 'All languages') : languageLabel(lang)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <CardGridSkeleton className="decks-grid decks-grid--skeleton" count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="decks-empty"
          icon={<BookOpen size={40} />}
          title={query ? t('decks.noMatchingDecks', 'No matching decks') : t('decks.noDecksYet', 'No decks yet')}
          description={query ? 'Try a different search.' : t('decks.generateFirstDeck', 'Generate your first deck to get started.')}
          actions={!query ? (
            <button className="decks-empty__cta" onClick={() => navigate('/app/generate')}>
              <Plus size={15} /> {t('decks.generateDeck', 'Generate Deck')}
            </button>
          ) : null}
        />
      ) : (
        <div className="decks-grid">
          {filtered.map((deck, i) => {
            const theme = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
            const cardCount = deck.cardCount ?? deck.flashcards?.length ?? 0;
            return (
              <motion.div
                key={deck.id}
                className="deck-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => navigate(`/app/study/${deck.id}`)}
              >
                {/* Colorful top band */}
                <div className="deck-card__banner" style={{ background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                  {deck.thumbnailUrl ? (
                    <img src={deck.thumbnailUrl} alt={`${deck.title} thumbnail`} className="deck-card__thumb" loading="lazy" decoding="async" />
                  ) : (
                    <GraduationCap size={28} style={{ color: theme.color, opacity: 0.8 }} />
                  )}
                </div>

                <div className="deck-card__body">
                  <div className="deck-card__tags-row">
                    <span className="deck-card__subject-tag" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.color }}>
                      General
                    </span>
                    <span className="deck-card__language-tag">
                      <Languages size={11} />
                      {languageLabel(deck.languageCode)}
                    </span>
                    <span className={`deck-card__visibility ${deck.isPublic ? 'deck-card__visibility--public' : 'deck-card__visibility--private'}`}>
                      {deck.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                      {deck.isPublic ? t('decks.public', 'Public') : t('decks.private', 'Private')}
                    </span>
                  </div>
                  <h3 className="deck-card__title">{deck.title}</h3>
                  <p className="deck-card__description">
                    {deck.sourceText ? String(deck.sourceText).slice(0, 120) : 'No source notes attached to this deck yet.'}
                  </p>
                  <div className="deck-card__meta">
                    <span><BookOpen size={12} /> {cardCount} {t('decks.cards', 'cards')}</span>
                    <span><Clock size={12} /> {relativeDate(deck.createdAt)}</span>
                  </div>
                  <button className="deck-card__study-btn" onClick={(e) => { e.stopPropagation(); navigate(`/app/study/${deck.id}`); }}>
                    Study Deck
                  </button>
                </div>

                <div className="deck-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="deck-card__action-btn"
                    onClick={() => setTranslateModalDeck(deck)}
                    aria-label={t('decks.translateDeck', 'Translate deck')}
                    disabled={translatingDeckId === deck.id}
                  >
                    <Languages size={14} />
                  </button>
                  <button
                    className="deck-card__action-btn"
                    onClick={() => openEditModal(deck)}
                    aria-label="Edit deck"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="deck-card__action-btn deck-card__action-btn--danger"
                    onClick={() => setDeletingDeck(deck)}
                    aria-label="Delete deck"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {editingDeck && (
        <div className="deck-edit-modal__backdrop" onClick={closeEditModal}>
          <div className="deck-edit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit deck">
            <h3 className="deck-edit-modal__title">Edit Deck</h3>

            <label className="deck-edit-modal__label" htmlFor="deck-title-input">Title</label>
            <input
              id="deck-title-input"
              className="deck-edit-modal__input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={200}
              disabled={savingEdit}
            />

            <label className="deck-edit-modal__label" htmlFor="deck-notes-input">Notes / Source</label>
            <textarea
              id="deck-notes-input"
              className="deck-edit-modal__textarea"
              value={editSourceText}
              onChange={(e) => setEditSourceText(e.target.value)}
              rows={6}
              maxLength={20000}
              disabled={savingEdit}
            />

            <div className="deck-edit-modal__visibility-row">
              <span className="deck-edit-modal__visibility-label">Visibility</span>
              <button
                type="button"
                className={`deck-edit-modal__visibility-toggle ${editIsPublic ? 'deck-edit-modal__visibility-toggle--public' : 'deck-edit-modal__visibility-toggle--private'}`}
                onClick={() => setEditIsPublic((prev) => !prev)}
                disabled={savingEdit}
              >
                {editIsPublic ? <Globe size={13} /> : <Lock size={13} />}
                {editIsPublic ? 'Public' : 'Private'}
              </button>
            </div>

            <label className="deck-edit-modal__label" htmlFor="deck-thumb-input">Thumbnail</label>
            {editThumbnailPreview && (
              <img src={editThumbnailPreview} alt="Thumbnail preview" className="deck-edit-modal__thumb-preview" loading="lazy" decoding="async" />
            )}
            <div
              className={`deck-edit-modal__dropzone ${thumbnailDragOver ? 'deck-edit-modal__dropzone--over' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => thumbnailInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  thumbnailInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setThumbnailDragOver(true);
              }}
              onDragLeave={() => setThumbnailDragOver(false)}
              onDrop={handleThumbnailDrop}
            >
              <p className="deck-edit-modal__dropzone-title">Drop image here or click to upload</p>
              <p className="deck-edit-modal__dropzone-sub">JPEG, PNG, WEBP up to 5MB</p>
            </div>
            <input
              ref={thumbnailInputRef}
              id="deck-thumb-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="deck-edit-modal__file deck-edit-modal__file--hidden"
              onChange={handleThumbnailFile}
              disabled={savingEdit}
            />

            <div className="deck-edit-modal__actions">
              <button className="deck-edit-modal__btn deck-edit-modal__btn--ghost" onClick={closeEditModal} disabled={savingEdit}>
                Cancel
              </button>
              <button className="deck-edit-modal__btn deck-edit-modal__btn--primary" onClick={handleEditDeck} disabled={savingEdit}>
                {savingEdit ? t('common.loading', 'Loading...') : t('decks.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      <LanguageSelectModal
        open={Boolean(translateModalDeck)}
        title={t('decks.chooseTranslateLanguage', 'Choose translation language')}
        subtitle={t('decks.chooseTranslateLanguageSubtitle', 'Create a translated copy of this deck in your library.')}
        sourceLanguageCode={translateModalDeck?.languageCode || 'en'}
        onClose={() => setTranslateModalDeck(null)}
        onSelect={(code) => {
          if (!translateModalDeck) return;
          handleTranslateDeck(translateModalDeck, code);
        }}
      />

      {deletingDeck && (
        <div className="deck-edit-modal__backdrop" onClick={() => !deleting && setDeletingDeck(null)}>
          <div className="deck-delete-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Delete deck confirmation">
            <h3 className="deck-delete-modal__title">Delete Deck?</h3>
            <p className="deck-delete-modal__text">
              This will permanently delete <strong>{deletingDeck.title}</strong> and all its cards.
            </p>
            <div className="deck-delete-modal__actions">
              <button className="deck-edit-modal__btn deck-edit-modal__btn--ghost" onClick={() => setDeletingDeck(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="deck-edit-modal__btn deck-edit-modal__btn--danger" onClick={handleDeleteDeck} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
