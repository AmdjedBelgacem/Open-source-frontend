import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBigDown, ArrowBigUp, ChevronDown, Flag, MessageCircle, MoreVertical, Pencil, SendHorizontal, Trash2, X } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import useI18n from '../../../hooks/useI18n';
import { getStudyHubCategoryMeta, THREAD_CATEGORIES } from './studyHubCategoryMeta';
import './StudyHubThreadPage.css';

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

function CommentNode({
  node,
  currentUserId,
  onVote,
  onReply,
  onReport,
  onStartEdit,
  onSaveEdit,
  onDelete,
  activeReplyId,
  setActiveReplyId,
  replyBody,
  setReplyBody,
  replyingId,
  editingCommentId,
  editCommentBody,
  setEditCommentBody,
  savingCommentEdit,
  openActionMenu,
  setOpenActionMenu,
  onOpenDeleteModal,
  t,
}) {
  const isOwner = currentUserId && node.author?.id === currentUserId;
  const isEditing = editingCommentId === node.id;

  return (
    <div className="studyhub-comment" style={{ marginLeft: `${Math.min(node.depth * 18, 108)}px` }}>
      <div className="studyhub-comment__votes">
        <button
          type="button"
          className={`studyhub-vote-btn ${node.viewerVote === 1 ? 'studyhub-vote-btn--up' : ''}`}
          onClick={() => onVote(node, 1)}
        >
          <ArrowBigUp size={15} />
        </button>
        <span>{node.score}</span>
        <button
          type="button"
          className={`studyhub-vote-btn ${node.viewerVote === -1 ? 'studyhub-vote-btn--down' : ''}`}
          onClick={() => onVote(node, -1)}
        >
          <ArrowBigDown size={15} />
        </button>
      </div>

      <div className="studyhub-comment__content">
        <p className="studyhub-comment__meta">{node.author?.displayName || 'Learner'} · {relativeDate(node.createdAt)}</p>

        {isEditing ? (
          <div className="studyhub-comment__edit-wrap">
            <textarea
              rows={3}
              value={editCommentBody}
              onChange={(e) => setEditCommentBody(e.target.value)}
              disabled={savingCommentEdit}
            />
            <div className="studyhub-comment__edit-actions">
              <button type="button" onClick={() => onSaveEdit(node)} disabled={savingCommentEdit}>
                {savingCommentEdit ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
              <button type="button" onClick={() => onStartEdit(null)} disabled={savingCommentEdit}>
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p className="studyhub-comment__body">{node.body}</p>
        )}

        <div className="studyhub-comment__actions">
          <button type="button" onClick={() => setActiveReplyId(activeReplyId === node.id ? '' : node.id)}>
            <MessageCircle size={13} /> {t('studyHub.reply', 'Reply')}
          </button>
          <div className="studyhub-menu">
            <button
              type="button"
              className="studyhub-menu__trigger"
              onClick={() => setOpenActionMenu(openActionMenu === node.id ? '' : node.id)}
              aria-label={t('studyHub.moreActions', 'More actions')}
            >
              <MoreVertical size={14} />
            </button>
            {openActionMenu === node.id && (
              <div className="studyhub-menu__dropdown">
                <button type="button" onClick={() => { onReport('comment', node.id); setOpenActionMenu(''); }}>
                  <Flag size={13} /> {t('studyHub.report', 'Report')}
                </button>
                {isOwner && !isEditing && (
                  <button type="button" onClick={() => { onStartEdit(node); setOpenActionMenu(''); }}>
                    <Pencil size={13} /> {t('studyHub.edit', 'Edit')}
                  </button>
                )}
                {isOwner && (
                  <button type="button" onClick={() => { onOpenDeleteModal(node); setOpenActionMenu(''); }}>
                    <Trash2 size={13} /> {t('studyHub.delete', 'Delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {activeReplyId === node.id && (
          <form
            className="studyhub-reply-form"
            onSubmit={(e) => {
              e.preventDefault();
              onReply(node);
            }}
          >
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
              placeholder={t('studyHub.replyPlaceholder', 'Write your reply...')}
              disabled={replyingId === node.id}
            />
            <button type="submit" disabled={replyingId === node.id}>
              <SendHorizontal size={13} /> {replyingId === node.id ? t('common.loading', 'Loading...') : t('studyHub.postReply', 'Post Reply')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StudyHubThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [commentBody, setCommentBody] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [replyingId, setReplyingId] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [activeReplyId, setActiveReplyId] = useState('');

  const [votingThread, setVotingThread] = useState(false);
  const [votingCommentId, setVotingCommentId] = useState('');
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [editThreadBody, setEditThreadBody] = useState('');
  const [editThreadCategory, setEditThreadCategory] = useState('general');
  const [savingThreadEdit, setSavingThreadEdit] = useState(false);
  const [threadEditOpen, setThreadEditOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editCommentBody, setEditCommentBody] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [threadDeleteOpen, setThreadDeleteOpen] = useState(false);
  const [commentDeleteOpen, setCommentDeleteOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [openThreadMenu, setOpenThreadMenu] = useState(false);
  const [openCommentMenu, setOpenCommentMenu] = useState('');
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState('thread');
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadThread = async () => {
    setLoading(true);
    try {
      const [threadRes, commentsRes] = await Promise.all([
        fetch(`/api/v2/studyhub/threads/${threadId}`),
        fetch(`/api/v2/studyhub/threads/${threadId}/comments`),
      ]);

      const threadPayload = await threadRes.json().catch(() => ({}));
      const commentsPayload = await commentsRes.json().catch(() => ({}));

      if (!threadRes.ok) throw new Error(threadPayload.error || 'Failed to load thread.');
      if (!commentsRes.ok) throw new Error(commentsPayload.error || 'Failed to load comments.');

      setThread(threadPayload.thread || null);
      setComments(Array.isArray(commentsPayload.comments) ? commentsPayload.comments : []);
      setEditingCommentId('');
      setOpenThreadMenu(false);
      setOpenCommentMenu('');
      setEditCategoryOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to load StudyHub thread.', { type: 'error' });
      navigate('/app/studyhub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThread();
  }, [threadId]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (target && target.closest && target.closest('.studyhub-menu')) return;
      setOpenThreadMenu(false);
      setOpenCommentMenu('');
      setEditCategoryOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [comments],
  );

  const threadCategoryMeta = useMemo(
    () => getStudyHubCategoryMeta(thread?.category),
    [thread?.category],
  );
  const ThreadCategoryIcon = threadCategoryMeta.icon;

  const isThreadOwner = Boolean(user?.id && thread?.author?.id === user.id);

  const voteThread = async (direction) => {
    if (!accessToken) {
      showToast(t('studyHub.signInToVote', 'Please sign in to vote.'), { type: 'error' });
      return;
    }
    if (!thread || votingThread) return;

    setVotingThread(true);
    const nextVote = thread.viewerVote === direction ? 0 : direction;

    try {
      const res = await fetch(`/api/v2/studyhub/threads/${thread.id}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: nextVote }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to vote on thread.');

      setThread((prev) => (prev ? {
        ...prev,
        score: payload.score,
        upvotes: payload.upvotes,
        downvotes: payload.downvotes,
        viewerVote: payload.viewerVote,
      } : prev));
    } catch (err) {
      showToast(err.message || 'Failed to vote on thread.', { type: 'error' });
    } finally {
      setVotingThread(false);
    }
  };

  const voteComment = async (comment, direction) => {
    if (!accessToken) {
      showToast(t('studyHub.signInToVote', 'Please sign in to vote.'), { type: 'error' });
      return;
    }
    if (votingCommentId) return;

    setVotingCommentId(comment.id);
    const nextVote = comment.viewerVote === direction ? 0 : direction;

    try {
      const res = await fetch(`/api/v2/studyhub/comments/${comment.id}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: nextVote }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to vote on comment.');

      setComments((prev) => prev.map((item) => (
        item.id === comment.id
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
      showToast(err.message || t('studyHub.voteFailed', 'Failed to vote.'), { type: 'error' });
    } finally {
      setVotingCommentId('');
    }
  };

  const postComment = async (parentCommentId = null) => {
    if (!accessToken) {
      showToast(t('studyHub.signInToComment', 'Please sign in to comment.'), { type: 'error' });
      return;
    }
    if (postingComment) return;
    if ((!parentCommentId && !commentBody.trim()) || (parentCommentId && !replyBody.trim())) {
      showToast(t('studyHub.commentValidation', 'Comment cannot be empty.'), { type: 'error' });
      return;
    }

    setPostingComment(true);
    if (parentCommentId) setReplyingId(parentCommentId);

    try {
      const body = parentCommentId ? replyBody.trim() : commentBody.trim();
      const res = await fetch(`/api/v2/studyhub/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body, parentCommentId }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to post comment.');

      if (payload.comment) {
        setComments((prev) => [...prev, payload.comment]);
      }
      if (typeof payload.threadCommentCount === 'number') {
        setThread((prev) => (prev ? { ...prev, commentCount: payload.threadCommentCount } : prev));
      }

      if (parentCommentId) {
        setReplyBody('');
        setActiveReplyId('');
      } else {
        setCommentBody('');
      }
    } catch (err) {
      showToast(err.message || t('studyHub.commentFailed', 'Failed to post comment.'), { type: 'error' });
    } finally {
      setPostingComment(false);
      setReplyingId('');
    }
  };

  const openReportModal = (targetType, targetId) => {
    if (!accessToken) {
      showToast(t('studyHub.signInToReport', 'Please sign in to report content.'), { type: 'error' });
      return;
    }
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setReportReason('spam');
    setReportDetails('');
    setReportOpen(true);
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!accessToken || !reportTargetId) return;

    setSubmittingReport(true);
    try {
      const res = await fetch('/api/v2/studyhub/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: reportTargetType,
          targetId: reportTargetId,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to submit report.');
      showToast(t('studyHub.reportSubmitted', 'Report submitted.'), { type: 'success' });
      setReportOpen(false);
    } catch (err) {
      showToast(err.message || t('studyHub.reportFailed', 'Failed to submit report.'), { type: 'error' });
    } finally {
      setSubmittingReport(false);
    }
  };

  const startEditThread = () => {
    if (!thread) return;
    setEditThreadTitle(thread.title || '');
    setEditThreadBody(thread.body || '');
    setEditThreadCategory(thread.category || 'general');
    setEditCategoryOpen(false);
    setThreadEditOpen(true);
  };

  const saveEditThread = async () => {
    if (!accessToken || !thread) return;
    const title = editThreadTitle.trim();
    const body = editThreadBody.trim();

    if (title.length < 5 || body.length < 5) {
      showToast(t('studyHub.threadValidation', 'Title and body must each have at least 5 characters.'), { type: 'error' });
      return;
    }

    setSavingThreadEdit(true);
    try {
      const res = await fetch(`/api/v2/studyhub/threads/${thread.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, category: editThreadCategory || 'general' }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to update thread.');
      setThread(payload.thread || thread);
      setThreadEditOpen(false);
      setEditCategoryOpen(false);
      showToast(t('studyHub.threadUpdated', 'Thread updated.'), { type: 'success' });
    } catch (err) {
      showToast(err.message || t('studyHub.threadUpdateFailed', 'Failed to update thread.'), { type: 'error' });
    } finally {
      setSavingThreadEdit(false);
    }
  };

  const deleteThread = async () => {
    if (!accessToken || !thread || deletingThread) return;
    setDeletingThread(true);
    try {
      const res = await fetch(`/api/v2/studyhub/threads/${thread.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to delete thread.');
      showToast(t('studyHub.threadDeleted', 'Thread deleted.'), { type: 'success' });
      setThreadDeleteOpen(false);
      navigate('/app/studyhub');
    } catch (err) {
      showToast(err.message || t('studyHub.threadDeleteFailed', 'Failed to delete thread.'), { type: 'error' });
    } finally {
      setDeletingThread(false);
    }
  };

  const startEditComment = (comment) => {
    if (!comment) {
      setEditingCommentId('');
      setEditCommentBody('');
      return;
    }
    setEditingCommentId(comment.id);
    setEditCommentBody(comment.body || '');
  };

  const saveEditComment = async (comment) => {
    if (!accessToken || !comment || !editingCommentId) return;
    const body = editCommentBody.trim();
    if (!body) {
      showToast(t('studyHub.commentValidation', 'Comment cannot be empty.'), { type: 'error' });
      return;
    }

    setSavingCommentEdit(true);
    try {
      const res = await fetch(`/api/v2/studyhub/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to update comment.');

      if (payload.comment) {
        setComments((prev) => prev.map((item) => (item.id === comment.id ? { ...item, ...payload.comment } : item)));
      }
      setEditingCommentId('');
      setEditCommentBody('');
      showToast(t('studyHub.commentUpdated', 'Comment updated.'), { type: 'success' });
    } catch (err) {
      showToast(err.message || t('studyHub.commentUpdateFailed', 'Failed to update comment.'), { type: 'error' });
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const deleteComment = async (comment) => {
    if (!accessToken || !comment || deletingCommentId) return;

    setDeletingCommentId(comment.id);
    try {
      const res = await fetch(`/api/v2/studyhub/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to delete comment.');

      showToast(t('studyHub.commentDeleted', 'Comment deleted.'), { type: 'success' });
      setCommentDeleteOpen(false);
      setCommentToDelete(null);
      await loadThread();
    } catch (err) {
      showToast(err.message || t('studyHub.commentDeleteFailed', 'Failed to delete comment.'), { type: 'error' });
    } finally {
      setDeletingCommentId('');
    }
  };

  const openDeleteCommentModal = (comment) => {
    setCommentToDelete(comment);
    setCommentDeleteOpen(true);
  };

  if (loading || !thread) {
    return (
      <div className="studyhub-thread-page" aria-hidden="true">
        <article className="studyhub-thread-main studyhub-thread-main--skeleton">
          <div className="studyhub-thread-main__skeleton-line studyhub-thread-main__skeleton-line--title sb-skeleton" />
          <div className="studyhub-thread-main__skeleton-line sb-skeleton" />
          <div className="studyhub-thread-main__skeleton-line studyhub-thread-main__skeleton-line--short sb-skeleton" />
          <div className="studyhub-thread-main__skeleton-block sb-skeleton" />
        </article>
      </div>
    );
  }

  return (
    <div className="studyhub-thread-page">
      <button className="studyhub-thread-back" onClick={() => navigate('/app/studyhub')}>
        ← {t('studyHub.backToHub', 'Back to StudyHub')}
      </button>

      <article className="studyhub-thread-main">
        <div className="studyhub-thread-main__votes">
          <button
            type="button"
            className={`studyhub-vote-btn ${thread.viewerVote === 1 ? 'studyhub-vote-btn--up' : ''}`}
            onClick={() => voteThread(1)}
            disabled={votingThread}
          >
            <ArrowBigUp size={17} />
          </button>
          <span>{thread.score}</span>
          <button
            type="button"
            className={`studyhub-vote-btn ${thread.viewerVote === -1 ? 'studyhub-vote-btn--down' : ''}`}
            onClick={() => voteThread(-1)}
            disabled={votingThread}
          >
            <ArrowBigDown size={17} />
          </button>
        </div>

        <div className="studyhub-thread-main__content">
          <h1>{thread.title}</h1>
          <p className="studyhub-thread-main__meta">{thread.author?.displayName || 'Learner'} · {relativeDate(thread.createdAt)}</p>
          <span
            className="studyhub-thread-main__category"
            style={{
              '--cat-bg': threadCategoryMeta.colors.bg,
              '--cat-border': threadCategoryMeta.colors.border,
              '--cat-color': threadCategoryMeta.colors.text,
            }}
          >
            <ThreadCategoryIcon size={12} />
            {t(`studyHub.category.${threadCategoryMeta.value}`, threadCategoryMeta.label)}
          </span>
          <p className="studyhub-thread-main__body">{thread.body}</p>
          {thread.imageUrl && <img src={thread.imageUrl} alt="Thread" className="studyhub-thread-main__image" loading="lazy" decoding="async" />}

          <div className="studyhub-thread-main__actions">
            <div className="studyhub-menu">
              <button
                type="button"
                className="studyhub-menu__trigger"
                onClick={() => setOpenThreadMenu((prev) => !prev)}
                aria-label={t('studyHub.moreActions', 'More actions')}
              >
                <MoreVertical size={15} />
              </button>
              {openThreadMenu && (
                <div className="studyhub-menu__dropdown">
                  <button type="button" onClick={() => { openReportModal('thread', thread.id); setOpenThreadMenu(false); }}>
                    <Flag size={14} /> {t('studyHub.report', 'Report')}
                  </button>
                  {isThreadOwner && (
                    <button type="button" onClick={() => { startEditThread(); setOpenThreadMenu(false); }}>
                      <Pencil size={14} /> {t('studyHub.edit', 'Edit')}
                    </button>
                  )}
                  {isThreadOwner && (
                    <button type="button" onClick={() => { setThreadDeleteOpen(true); setOpenThreadMenu(false); }}>
                      <Trash2 size={14} /> {t('studyHub.delete', 'Delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <span>{thread.commentCount} {t('studyHub.comments', 'comments')}</span>
          </div>
        </div>
      </article>

      <section className="studyhub-comment-compose">
        <h2>{t('studyHub.joinDiscussion', 'Join the discussion')}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postComment();
          }}
        >
          <textarea
            rows={3}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder={t('studyHub.commentPlaceholder', 'Write a helpful comment...')}
            disabled={postingComment}
          />
          <button type="submit" disabled={postingComment}>
            <SendHorizontal size={14} /> {postingComment ? t('common.loading', 'Loading...') : t('studyHub.postComment', 'Post Comment')}
          </button>
        </form>
      </section>

      <section className="studyhub-comment-list">
        <h3>{thread.commentCount} {t('studyHub.comments', 'comments')}</h3>
        {sortedComments.length === 0 ? (
          <p className="studyhub-comment-list__empty">{t('studyHub.noCommentsYet', 'No comments yet. Be the first to contribute.')}</p>
        ) : (
          sortedComments.map((node) => (
            <CommentNode
              key={node.id}
              node={node}
              currentUserId={user?.id || ''}
              onVote={voteComment}
              onReply={() => postComment(node.id)}
              onReport={openReportModal}
              onStartEdit={startEditComment}
              onSaveEdit={saveEditComment}
              onDelete={deleteComment}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              replyingId={replyingId}
              editingCommentId={editingCommentId}
              editCommentBody={editCommentBody}
              setEditCommentBody={setEditCommentBody}
              savingCommentEdit={savingCommentEdit || deletingCommentId === node.id || votingCommentId === node.id}
              openActionMenu={openCommentMenu}
              setOpenActionMenu={setOpenCommentMenu}
              onOpenDeleteModal={openDeleteCommentModal}
              t={t}
            />
          ))
        )}
      </section>

      {threadEditOpen && (
        <div className="studyhub-edit-modal__backdrop" onClick={() => {
          if (savingThreadEdit) return;
          setThreadEditOpen(false);
          setEditCategoryOpen(false);
        }}>
          <div className="studyhub-edit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="studyhub-edit-modal__head">
              <h3>{t('studyHub.editThread', 'Edit Thread')}</h3>
              <button
                type="button"
                onClick={() => {
                  setThreadEditOpen(false);
                  setEditCategoryOpen(false);
                }}
                disabled={savingThreadEdit}
                aria-label={t('common.close', 'Close')}
              >
                <X size={14} />
              </button>
            </div>

            <div className="studyhub-edit-modal__body">
              <input
                type="text"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                maxLength={180}
                disabled={savingThreadEdit}
              />
              <textarea
                rows={5}
                value={editThreadBody}
                onChange={(e) => setEditThreadBody(e.target.value)}
                maxLength={20000}
                disabled={savingThreadEdit}
              />
              <div className="studyhub-menu studyhub-edit-category-menu">
                <button
                  type="button"
                  className="studyhub-menu__trigger studyhub-edit-category-menu__trigger"
                  onClick={() => !savingThreadEdit && setEditCategoryOpen((prev) => !prev)}
                  disabled={savingThreadEdit}
                  aria-label={t('studyHub.threadCategory', 'Thread category')}
                >
                  <span>{t(`studyHub.category.${editThreadCategory}`, editThreadCategory)}</span>
                  <ChevronDown size={14} />
                </button>
                {editCategoryOpen && (
                  <div className="studyhub-menu__dropdown studyhub-edit-category-menu__dropdown">
                    {THREAD_CATEGORIES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setEditThreadCategory(item.value);
                          setEditCategoryOpen(false);
                        }}
                      >
                        {t(`studyHub.category.${item.value}`, item.label)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="studyhub-edit-modal__actions">
              <button type="button" onClick={saveEditThread} disabled={savingThreadEdit}>
                {savingThreadEdit ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {threadDeleteOpen && (
        <div className="studyhub-delete-modal__backdrop" onClick={() => !deletingThread && setThreadDeleteOpen(false)}>
          <div className="studyhub-delete-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>{t('studyHub.deleteThreadTitle', 'Delete Thread')}</h3>
            <p>{t('studyHub.deleteThreadConfirm', 'Delete this thread and all comments?')}</p>
            <div className="studyhub-delete-modal__actions">
              <button type="button" onClick={() => setThreadDeleteOpen(false)} disabled={deletingThread}>{t('common.cancel', 'Cancel')}</button>
              <button type="button" onClick={deleteThread} disabled={deletingThread}>
                {deletingThread ? t('common.loading', 'Loading...') : t('studyHub.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentDeleteOpen && commentToDelete && (
        <div className="studyhub-delete-modal__backdrop" onClick={() => !deletingCommentId && setCommentDeleteOpen(false)}>
          <div className="studyhub-delete-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>{t('studyHub.deleteCommentTitle', 'Delete Comment')}</h3>
            <p>{t('studyHub.deleteCommentConfirm', 'Delete this comment? Replies will be deleted too.')}</p>
            <div className="studyhub-delete-modal__actions">
              <button type="button" onClick={() => setCommentDeleteOpen(false)} disabled={Boolean(deletingCommentId)}>{t('common.cancel', 'Cancel')}</button>
              <button type="button" onClick={() => deleteComment(commentToDelete)} disabled={Boolean(deletingCommentId)}>
                {deletingCommentId ? t('common.loading', 'Loading...') : t('studyHub.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="studyhub-report-modal__backdrop" onClick={() => !submittingReport && setReportOpen(false)}>
          <div className="studyhub-report-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="studyhub-report-modal__head">
              <h3>{t('studyHub.reportContent', 'Report Content')}</h3>
              <button type="button" onClick={() => setReportOpen(false)} disabled={submittingReport} aria-label={t('common.close', 'Close')}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={submitReport} className="studyhub-report-modal__form">
              <label htmlFor="studyhub-report-reason">{t('studyHub.reportReason', 'Reason')}</label>
              <select
                id="studyhub-report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                disabled={submittingReport}
              >
                <option value="spam">{t('studyHub.reasonSpam', 'Spam')}</option>
                <option value="abuse">{t('studyHub.reasonAbuse', 'Abusive behavior')}</option>
                <option value="misinformation">{t('studyHub.reasonMisinformation', 'Misinformation')}</option>
                <option value="offtopic">{t('studyHub.reasonOfftopic', 'Off-topic')}</option>
                <option value="other">{t('studyHub.reasonOther', 'Other')}</option>
              </select>

              <label htmlFor="studyhub-report-details">{t('studyHub.reportDetailsOptional', 'Details (optional)')}</label>
              <textarea
                id="studyhub-report-details"
                rows={4}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={2000}
                disabled={submittingReport}
              />

              <button type="submit" disabled={submittingReport}>
                {submittingReport ? t('common.loading', 'Loading...') : t('studyHub.submitReport', 'Submit Report')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
