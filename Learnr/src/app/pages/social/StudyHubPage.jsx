import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBigDown, ArrowBigUp, ChevronDown, ImagePlus, MessageCircle, Search, Share2, TrendingUp, Users } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import { getStudyHubCategoryMeta, THREAD_CATEGORIES } from './studyHubCategoryMeta';
import './StudyHubPage.css';

const FEED_SORTS = [
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
];

function relativeDate(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export default function StudyHubPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [votingThreadId, setVotingThreadId] = useState('');

  const [sort, setSort] = useState('new');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const imageInputRef = useRef(null);
  const createCategoryRef = useRef(null);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: '30' });
      if (query.trim()) params.set('q', query.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await fetch(`/api/v2/studyhub/threads?${params.toString()}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to load StudyHub threads.');
      setThreads(Array.isArray(payload.threads) ? payload.threads : []);
    } catch (err) {
      showToast(err.message || 'Failed to load StudyHub threads.', { type: 'error' });
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [sort, categoryFilter]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (createCategoryRef.current && !createCategoryRef.current.contains(target)) {
        setCreateCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const activeCreateCategory = getStudyHubCategoryMeta(category);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const titleText = String(thread.title || '').toLowerCase();
      const bodyText = String(thread.body || '').toLowerCase();
      const author = String(thread.author?.displayName || '').toLowerCase();
      return titleText.includes(q) || bodyText.includes(q) || author.includes(q);
    });
  }, [threads, query]);

  const navCategories = useMemo(() => (
    [{ value: 'all', label: t('studyHub.allThreads', 'All Threads') }, ...THREAD_CATEGORIES.slice(0, 6).map((item) => ({
      value: item.value,
      label: t(`studyHub.category.${item.value}`, item.label),
    }))]
  ), [t]);

  const trendingTopics = useMemo(() => {
    const counts = new Map();
    filteredThreads.forEach((thread) => {
      const key = thread.category || 'general';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([value]) => t(`studyHub.category.${value}`, value).replace(/\s+/g, ''));
  }, [filteredThreads, t]);

  const topContributors = useMemo(() => {
    const map = new Map();
    filteredThreads.forEach((thread) => {
      const id = thread.author?.id || thread.author?.displayName || 'learner';
      const existing = map.get(id) || {
        id,
        name: thread.author?.displayName || 'Learner',
        avatar: thread.author?.avatarUrl || '',
        points: 0,
      };
      existing.points += Math.max(1, Number(thread.score || 0));
      map.set(id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.points - a.points).slice(0, 4);
  }, [filteredThreads]);

  const communityStats = useMemo(() => {
    const members = new Set(filteredThreads.map((thread) => thread.author?.id || thread.author?.displayName || 'learner')).size;
    const dailyThreads = filteredThreads.filter((thread) => Date.now() - new Date(thread.createdAt).getTime() < 86400000).length;
    return {
      members,
      dailyThreads,
    };
  }, [filteredThreads]);

  const handleCreateThread = async (event) => {
    event.preventDefault();

    if (!accessToken) {
      showToast('Please sign in to create a thread.', { type: 'error' });
      return;
    }

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (cleanTitle.length < 5) {
      showToast('Title must be at least 5 characters.', { type: 'error' });
      return;
    }

    if (cleanBody.length < 5) {
      showToast('Post content must be at least 5 characters.', { type: 'error' });
      return;
    }

    setCreating(true);
    try {
      let image = null;
      if (imageFile) {
        image = {
          mimeType: imageFile.type,
          fileName: imageFile.name,
          base64Data: await toBase64(imageFile),
        };
      }

      const res = await fetch('/api/v2/studyhub/threads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: cleanTitle, body: cleanBody, category, image }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to create thread.');

      setThreads((prev) => [payload.thread, ...prev]);
      setTitle('');
      setBody('');
      setCategory('general');
      setImageFile(null);
      setImagePreviewUrl('');
      showToast('Thread created.', { type: 'success' });
    } catch (err) {
      showToast(err.message || 'Failed to create thread.', { type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const onThreadVote = async (thread, nextVote) => {
    if (!accessToken || votingThreadId) return;
    setVotingThreadId(thread.id);

    const targetVote = thread.viewerVote === nextVote ? 0 : nextVote;

    try {
      const res = await fetch(`/api/v2/studyhub/threads/${thread.id}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: targetVote }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to vote.');

      setThreads((prev) => prev.map((item) => (
        item.id === thread.id
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
      showToast(err.message || 'Failed to vote.', { type: 'error' });
    } finally {
      setVotingThreadId('');
    }
  };

  const userInitials = (userName) => {
    const parts = String(userName || 'L').trim().split(/\s+/);
    return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="studyhub-page">
      <aside className="studyhub-nav">
        <h2>{t('studyHub.title', 'StudyHub')}</h2>
        <p>{t('studyHub.communityFeed', 'Community Feed')}</p>

        <nav className="studyhub-nav__links">
          {navCategories.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`studyhub-nav__link ${categoryFilter === item.value ? 'studyhub-nav__link--active' : ''}`}
              onClick={() => setCategoryFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="studyhub-main">
        <form className="studyhub-create" onSubmit={handleCreateThread}>
          <div className="studyhub-create__head">
            <span className="studyhub-create__avatar">{userInitials('JD')}</span>
            <input
              type="text"
              className="studyhub-input"
              placeholder={t('studyHub.threadTitlePlaceholder', 'Thread title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={180}
              disabled={creating}
            />
          </div>

          <textarea
            className="studyhub-textarea"
            placeholder={t('studyHub.threadBodyPlaceholder', 'Share your academic insights or ask a question...')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={20000}
            disabled={creating}
          />

          <div className="studyhub-create__actions">
            <div className="studyhub-category-menu" ref={createCategoryRef}>
              <button
                type="button"
                className="studyhub-category-menu__trigger"
                onClick={() => !creating && setCreateCategoryOpen((prev) => !prev)}
                disabled={creating}
                aria-label={t('studyHub.threadCategory', 'Thread category')}
              >
                <span>{t(`studyHub.category.${activeCreateCategory.value}`, activeCreateCategory.label)}</span>
                <ChevronDown size={14} />
              </button>
              {createCategoryOpen && (
                <div className="studyhub-category-menu__dropdown">
                  {THREAD_CATEGORIES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={category === item.value ? 'studyhub-category-menu__item studyhub-category-menu__item--active' : 'studyhub-category-menu__item'}
                      onClick={() => {
                        setCategory(item.value);
                        setCreateCategoryOpen(false);
                      }}
                    >
                      {t(`studyHub.category.${item.value}`, item.label)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="studyhub-image-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={creating}
            >
              <ImagePlus size={15} /> {t('studyHub.addImage', 'Add Image')}
            </button>

            <button type="submit" className="studyhub-primary-btn" disabled={creating}>
              {creating ? t('common.loading', 'Loading...') : t('studyHub.postThread', 'Post Thread')}
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const next = e.target.files?.[0];
              e.target.value = '';
              if (!next) return;
              if (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type)) {
                showToast('Only PNG, JPEG, and WEBP are supported.', { type: 'error' });
                return;
              }
              if (next.size > 5 * 1024 * 1024) {
                showToast('Image exceeds 5MB limit.', { type: 'error' });
                return;
              }
              setImageFile(next);
              setImagePreviewUrl(URL.createObjectURL(next));
            }}
          />

          {imagePreviewUrl && (
            <div className="studyhub-create__image-wrap">
              <img src={imagePreviewUrl} alt="Thread preview" className="studyhub-create__image" loading="lazy" decoding="async" />
              <button
                type="button"
                className="studyhub-create__remove-image"
                onClick={() => {
                  setImageFile(null);
                  setImagePreviewUrl('');
                }}
                disabled={creating}
              >
                {t('studyHub.removeImage', 'Remove image')}
              </button>
            </div>
          )}
        </form>

        <section className="studyhub-feed-controls">
          <div className="studyhub-search">
            <Search size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('studyHub.searchThreads', 'Search topics, users, or tags...')}
            />
          </div>
          <div className="studyhub-sort-pills">
            {FEED_SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`studyhub-sort-pill ${sort === option.value ? 'studyhub-sort-pill--active' : ''}`}
                onClick={() => setSort(option.value)}
              >
                {option.value === 'new' ? t('studyHub.sortNew', option.label) : t('studyHub.sortTop', option.label)}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <section className="studyhub-feed studyhub-feed--skeleton" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <article key={index} className="studyhub-thread-card studyhub-thread-card--skeleton">
                <div className="studyhub-thread-card__main">
                  <div className="studyhub-thread-card__skeleton-line studyhub-thread-card__skeleton-line--title sb-skeleton" />
                  <div className="studyhub-thread-card__skeleton-line sb-skeleton" />
                  <div className="studyhub-thread-card__skeleton-line studyhub-thread-card__skeleton-line--short sb-skeleton" />
                </div>
                <div className="studyhub-thread-card__placeholder studyhub-thread-card__placeholder--skeleton sb-skeleton" />
              </article>
            ))}
          </section>
        ) : filteredThreads.length === 0 ? (
          <p className="studyhub-empty">{t('studyHub.emptyThreads', 'No threads yet. Start the first discussion.')}</p>
        ) : (
          <section className="studyhub-feed">
            {filteredThreads.map((thread) => {
              const meta = getStudyHubCategoryMeta(thread.category);
              const CategoryIcon = meta.icon;

              return (
                <article key={thread.id} className="studyhub-thread-card">
                  <div className="studyhub-thread-card__main">
                    <div className="studyhub-thread-card__author-row">
                      <span className="studyhub-thread-card__author-avatar">{userInitials(thread.author?.displayName || 'L')}</span>
                      <div>
                        <p className="studyhub-thread-card__author-name">{thread.author?.displayName || 'Learner'}</p>
                        <p className="studyhub-thread-card__meta">{relativeDate(thread.createdAt)}</p>
                      </div>
                      <span
                        className="studyhub-thread-card__category"
                        style={{
                          '--cat-bg': meta.colors.bg,
                          '--cat-border': meta.colors.border,
                          '--cat-color': meta.colors.text,
                        }}
                      >
                        <CategoryIcon size={11} />
                        {t(`studyHub.category.${meta.value}`, meta.label)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="studyhub-thread-card__title"
                      onClick={() => navigate(`/app/studyhub/${thread.id}`)}
                    >
                      {thread.title}
                    </button>

                    <p className="studyhub-thread-card__body">{String(thread.body || '').slice(0, 180)}{String(thread.body || '').length > 180 ? '...' : ''}</p>

                    <div className="studyhub-thread-card__footer">
                      <div className="studyhub-thread-card__votes">
                        <button
                          type="button"
                          className={`studyhub-vote-btn ${thread.viewerVote === 1 ? 'studyhub-vote-btn--up' : ''}`}
                          onClick={() => onThreadVote(thread, 1)}
                          disabled={votingThreadId === thread.id}
                        >
                          <ArrowBigUp size={15} />
                        </button>
                        <span>{thread.score}</span>
                        <button
                          type="button"
                          className={`studyhub-vote-btn ${thread.viewerVote === -1 ? 'studyhub-vote-btn--down' : ''}`}
                          onClick={() => onThreadVote(thread, -1)}
                          disabled={votingThreadId === thread.id}
                        >
                          <ArrowBigDown size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="studyhub-thread-card__comments"
                        onClick={() => navigate(`/app/studyhub/${thread.id}`)}
                      >
                        <MessageCircle size={13} /> {thread.commentCount}
                      </button>
                      <span className="studyhub-thread-card__shares"><Share2 size={12} /> {Math.max(1, Math.floor(Math.abs(thread.score || 0) / 2))}</span>
                    </div>
                  </div>

                  {thread.imageUrl ? (
                    <img src={thread.imageUrl} alt="Thread" className="studyhub-thread-card__image" loading="lazy" decoding="async" />
                  ) : (
                    <div className="studyhub-thread-card__placeholder" />
                  )}
                </article>
              );
            })}
          </section>
        )}
      </section>

      <aside className="studyhub-right">
        <section className="studyhub-right__card">
          <h3><TrendingUp size={14} /> Trending Topics</h3>
          <div className="studyhub-right__tags">
            {trendingTopics.length === 0 ? (
              <span>#StudyTips</span>
            ) : (
              trendingTopics.map((topic) => <span key={topic}>#{topic}</span>)
            )}
          </div>
        </section>

        <section className="studyhub-right__card">
          <h3>Top Contributors</h3>
          <ul className="studyhub-right__contributors">
            {topContributors.length === 0 ? (
              <li>
                <span className="studyhub-right__avatar">L</span>
                <div>
                  <strong>Learner</strong>
                  <small>0 Points</small>
                </div>
              </li>
            ) : (
              topContributors.map((contributor) => (
                <li key={contributor.id}>
                  {contributor.avatar ? <img src={contributor.avatar} alt={contributor.name} className="studyhub-right__avatar-img" loading="lazy" decoding="async" /> : <span className="studyhub-right__avatar">{userInitials(contributor.name)}</span>}
                  <div>
                    <strong>{contributor.name}</strong>
                    <small>{contributor.points} Points</small>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="studyhub-right__stats">
          <h3>StudyHub Stats</h3>
          <div>
            <p>{communityStats.members}+</p>
            <small>Active Members</small>
          </div>
          <div>
            <p>{communityStats.dailyThreads}</p>
            <small>Daily Threads</small>
          </div>
        </section>
      </aside>
    </div>
  );
}
