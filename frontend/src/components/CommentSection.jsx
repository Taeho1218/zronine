import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { commentApi, postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from './Avatar'
import { CommentIcon, HeartIcon, LockIcon, ThumbsUpIcon, TrashIcon } from './icons'
import { formatDate, fromNow } from '../lib/format'
import { useBusy } from '../lib/useBusy'
import './CommentSection.css'

export default function CommentSection({ post, onCountChange }) {
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likeCount)

  const [content, setContent] = useState('')
  const [secret, setSecret] = useState(false)
  const [submitting, runSubmit] = useBusy()
  const [error, setError] = useState(null)

  const [replyTo, setReplyTo] = useState(null)
  const listRef = useRef(null)
  // 응답 전 재클릭 차단
  const [likeBusy, runLike] = useBusy()
  const [deleteBusy, runDelete] = useBusy()

  useEffect(() => {
    let alive = true
    setLoading(true)
    commentApi
      .list(post.postId)
      .then((list) => alive && setComments(list ?? []))
      .catch(() => alive && setComments([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [post.postId])

  // 원댓글 개수만 센다. 대댓글은 답변이라 "댓글 N개"에 합치면 실제 이야기 수보다 부풀려 보인다.
  const total = useMemo(() => comments.length, [comments])

  useEffect(() => {
    if (!loading) onCountChange?.(total)
  }, [total, loading, onCountChange])

  function requireLogin() {
    if (isLoggedIn) return false
    navigate('/login', { state: { from: `/posts/${post.postId}` } })
    return true
  }

  function toggleLike() {
    if (requireLogin()) return
    runLike(async () => {
      const next = !liked
      setLiked(next)
      setLikeCount((n) => n + (next ? 1 : -1))
      try {
        const res = next ? await postApi.like(post.postId) : await postApi.unlike(post.postId)
        if (res) {
          setLiked(res.liked)
          setLikeCount(res.likeCount)
        }
      } catch {
        setLiked(!next)
        setLikeCount((n) => n + (next ? -1 : 1))
      }
    })
  }

  function submit(e) {
    e.preventDefault()
    if (requireLogin()) return
    const text = content.trim()
    if (!text) return

    runSubmit(async () => {
      setError(null)
      try {
        await commentApi.create(post.postId, { content: text, secret })
        const list = await commentApi.list(post.postId)
        setComments(list ?? [])
        setContent('')
        setSecret(false)
      } catch (err) {
        setError(err.message)
      }
    })
  }

  async function submitReply(parentId, text, isSecret) {
    await commentApi.create(post.postId, { content: text, parentId, secret: isSecret })
    const list = await commentApi.list(post.postId)
    setComments(list ?? [])
    setReplyTo(null)
  }

  function remove(commentId) {
    if (!window.confirm('댓글을 삭제할까요?')) return
    runDelete(async () => {
      try {
        await commentApi.remove(commentId)
        const list = await commentApi.list(post.postId)
        setComments(list ?? [])
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  return (
    <section className="cmt" id="comments">
      <p className="cmt__crumb">
        <span className="cmt__crumb-title">{post.title}</span>
        <span className="cmt__crumb-sep">—</span>
        <strong>반응 · 댓글</strong>
      </p>

      <div className="cmt__reactions">
        <button
          type="button"
          className={`cmt__reaction ${liked ? 'is-on' : ''}`}
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={liked}
        >
          <ThumbsUpIcon width={20} height={20} filled={liked} />
          좋아요 <strong>{likeCount}</strong>
        </button>

        <button
          type="button"
          className="cmt__reaction"
          onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <CommentIcon width={20} height={20} />
          댓글 <strong>{total}</strong>
        </button>
      </div>

      <h2 className="cmt__heading" ref={listRef}>
        댓글 <span className="cmt__heading-count">{total}</span>
      </h2>

      <form className="cmt__form" onSubmit={submit}>
        <div className="cmt__form-row">
          <Avatar user={user ?? { nickname: '나' }} size={44} />
          <input
            className="cmt__input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="궁금한 점이나 참여 후기를 남겨보세요."
            maxLength={2000}
            aria-label="댓글 입력"
          />
        </div>

        <div className="cmt__form-foot">
          <label className="cmt__secret">
            <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
            <LockIcon width={15} height={15} />
            비밀댓글
          </label>

          <button type="submit" className="btn btn--primary cmt__submit" disabled={!content.trim() || submitting}>
            {submitting ? '등록 중…' : '등록'}
          </button>
        </div>

        {error && <p className="field__error cmt__error">{error}</p>}
      </form>

      {loading ? (
        <div className="state">
          <span className="spinner" />
        </div>
      ) : comments.length === 0 ? (
        <p className="cmt__empty">첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="cmt__list">
          {comments.map((c) => (
            <CommentItem
              key={c.commentId}
              comment={c}
              postAuthorId={post.author.userId}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onReply={submitReply}
              onRemove={remove}
              deleteBusy={deleteBusy}
              onNeedLogin={requireLogin}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function CommentItem({
  comment,
  postAuthorId,
  replyTo,
  setReplyTo,
  onReply,
  onRemove,
  deleteBusy,
  onNeedLogin,
  isReply = false,
}) {
  return (
    <li className={`cmt__item ${isReply ? 'cmt__item--reply' : ''}`}>
      <Avatar user={comment.author} size={40} />

      <div className="cmt__body">
        <div className="cmt__meta">
          <span className="cmt__name">{comment.author.nickname}</span>
          {comment.author.userId === postAuthorId && <span className="cmt__badge">주최자</span>}
          <span className="cmt__time">
            {formatDate(comment.createdAt)} · {fromNow(comment.createdAt)}
          </span>
        </div>

        <p className={`cmt__text ${comment.visible ? '' : 'cmt__text--masked'}`}>
          {!comment.visible && <LockIcon width={15} height={15} />}
          {comment.content}
        </p>

        <div className="cmt__actions">
          {/* 댓글 좋아요는 서버 API 가 아직 없어, 응답에 값이 있을 때만 노출한다. */}
          {comment.likeCount != null && (
            <span className="cmt__action">
              <HeartIcon width={15} height={15} />
              좋아요 {comment.likeCount}
            </span>
          )}

          {!isReply && (
            <button
              type="button"
              className="cmt__action cmt__action--btn"
              onClick={() => {
                if (onNeedLogin()) return
                setReplyTo(replyTo === comment.commentId ? null : comment.commentId)
              }}
            >
              답글
            </button>
          )}

          {comment.mine && (
            <button
              type="button"
              className="cmt__action cmt__action--btn"
              onClick={() => onRemove(comment.commentId)}
              disabled={deleteBusy}
            >
              <TrashIcon width={14} height={14} />
              삭제
            </button>
          )}
        </div>

        {replyTo === comment.commentId && (
          <ReplyForm onSubmit={(text, secret) => onReply(comment.commentId, text, secret)} onCancel={() => setReplyTo(null)} />
        )}

        {comment.replies?.length > 0 && (
          <ul className="cmt__replies">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.commentId}
                comment={r}
                postAuthorId={postAuthorId}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                onReply={onReply}
                onRemove={onRemove}
                deleteBusy={deleteBusy}
                onNeedLogin={onNeedLogin}
                isReply
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function ReplyForm({ onSubmit, onCancel }) {
  const [text, setText] = useState('')
  const [secret, setSecret] = useState(false)
  const [busy, run] = useBusy()

  function handle(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    run(async () => {
      try {
        await onSubmit(value, secret)
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  return (
    <form className="cmt__reply-form" onSubmit={handle}>
      <input
        className="cmt__input cmt__input--sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="답글을 남겨보세요."
        maxLength={2000}
        autoFocus
      />
      <label className="cmt__secret cmt__secret--sm">
        <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
        <LockIcon width={14} height={14} />
        비밀
      </label>
      <button type="button" className="btn btn--ghost cmt__reply-btn" onClick={onCancel}>
        취소
      </button>
      <button type="submit" className="btn btn--primary cmt__reply-btn" disabled={!text.trim() || busy}>
        등록
      </button>
    </form>
  )
}
