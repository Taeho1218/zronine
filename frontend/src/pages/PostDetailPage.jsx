import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from '../components/Avatar'
import CommentSection from '../components/CommentSection'
import { BellIcon, BookmarkIcon, ExternalLinkIcon, ImageIcon, TrashIcon } from '../components/icons'
import {
  ddayLabel,
  formatDateTime,
  formatPeriod,
  formatPrice,
  placeholderTone,
  PROGRESS_LABEL,
} from '../lib/format'
import './PostDetailPage.css'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setPost(null)
    postApi
      .detail(postId)
      .then((data) => alive && setPost(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [postId])

  // 사이드바 "비슷한 상품": 같은 카테고리 글에서 현재 글만 빼고 3개.
  // post 객체 전체를 의존성에 두면 좋아요/저장으로 post 가 갱신될 때마다 다시 부르게 되어
  // 실제로 목록을 다시 받아야 하는 값(글 id, 첫 카테고리)만 본다.
  const relatedCategoryId = post?.categories?.[0]?.categoryId
  const currentPostId = post?.postId

  useEffect(() => {
    if (!currentPostId) return undefined
    let alive = true
    postApi
      .list({ page: 0, categoryId: relatedCategoryId, postType: 'SELLER' })
      .then((page) => {
        if (!alive) return
        setRelated((page?.content ?? []).filter((p) => p.postId !== currentPostId).slice(0, 3))
      })
      .catch(() => alive && setRelated([]))
    return () => {
      alive = false
    }
  }, [currentPostId, relatedCategoryId])

  /**
   * 댓글 개수는 CommentSection 이 실제 목록을 세어 알려준다.
   * 콜백 정체성이 매 렌더 바뀌면 자식의 effect 가 계속 다시 돌아 무한 갱신이 되므로 useCallback 으로 고정하고,
   * 값이 같을 때는 이전 객체를 그대로 돌려줘 불필요한 리렌더도 끊는다.
   */
  const handleCommentCountChange = useCallback((count) => {
    setPost((prev) => (!prev || prev.commentCount === count ? prev : { ...prev, commentCount: count }))
  }, [])

  function requireLogin() {
    if (isLoggedIn) return false
    navigate('/login', { state: { from: `/posts/${postId}` } })
    return true
  }

  async function toggleSave() {
    if (requireLogin()) return
    const next = !post.saved
    setPost((p) => ({ ...p, saved: next }))
    try {
      if (next) await postApi.save(post.postId)
      else await postApi.unsave(post.postId)
    } catch {
      setPost((p) => ({ ...p, saved: !next }))
    }
  }

  async function toggleAlert() {
    if (requireLogin()) return
    const next = !post.alerted
    setPost((p) => ({ ...p, alerted: next }))
    try {
      if (next) await postApi.alert(post.postId)
      else await postApi.unalert(post.postId)
    } catch {
      setPost((p) => ({ ...p, alerted: !next }))
    }
  }

  async function removePost() {
    if (!window.confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return
    try {
      await postApi.remove(post.postId)
      navigate('/')
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="state">
        <span className="spinner" />
        <span>불러오는 중…</span>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="state">
        <p className="state__title">글을 불러오지 못했어요.</p>
        <p>{error ?? '존재하지 않는 게시글입니다.'}</p>
        <Link className="btn btn--ghost" to="/" style={{ marginTop: 12 }}>
          홈으로
        </Link>
      </div>
    )
  }

  const isSeller = post.postType === 'SELLER'
  const hero = post.imageUrls?.[0] ?? null

  return (
    <div className="detail page">
      <div className="detail__layout">
        <main className="detail__main">
          <header className="detail__head">
            <h1 className="detail__title">{post.title}</h1>

            <div className="detail__author-row">
              <Avatar user={post.author} size={44} />
              <div className="detail__author">
                <Link to={`/users/${post.author.userId}`} className="detail__author-name">
                  {post.author.nickname}
                </Link>
                <span className="detail__date">{formatDateTime(post.createdAt)}</span>
              </div>

              <div className="detail__head-actions">
                {isSeller && (
                  <button
                    type="button"
                    className={`detail__chip-btn ${post.alerted ? 'is-on' : ''}`}
                    onClick={toggleAlert}
                  >
                    <BellIcon width={17} height={17} />
                    {post.alerted ? '알림 신청됨' : '알림받기'}
                  </button>
                )}
                <button
                  type="button"
                  className={`detail__chip-btn ${post.saved ? 'is-on' : ''}`}
                  onClick={toggleSave}
                >
                  <BookmarkIcon width={17} height={17} filled={post.saved} />
                  {post.saved ? '저장됨' : '저장하기'}
                </button>
                {post.mine && (
                  <>
                    <Link to={`/write?edit=${post.postId}`} className="detail__chip-btn">
                      수정
                    </Link>
                    <button type="button" className="detail__chip-btn detail__chip-btn--danger" onClick={removePost}>
                      <TrashIcon width={16} height={16} />
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          <figure className={`detail__hero ${hero ? '' : `ph--${placeholderTone(post.postId)}`}`}>
            {hero ? (
              <img className="detail__hero-img" src={hero} alt={post.title} />
            ) : (
              <div className="detail__hero-empty">
                <ImageIcon width={44} height={44} />
                <span>이미지</span>
              </div>
            )}

            {isSeller && post.progress !== 'NONE' && (
              <figcaption className="detail__badge">
                <span className="detail__badge-dot" />
                {post.participantCount != null
                  ? `실시간 ${post.participantCount}명 참여 중`
                  : `${PROGRESS_LABEL[post.progress]} · ${ddayLabel(post.endDate)}`}
              </figcaption>
            )}
          </figure>

          {isSeller && (
            <dl className="detail__meta">
              <div className="detail__meta-row">
                <dt>기간</dt>
                <dd>
                  {formatPeriod(post.startDate, post.endDate)}{' '}
                  <span className="detail__dday">({ddayLabel(post.endDate)})</span>
                </dd>
              </div>

              <div className="detail__meta-row">
                <dt>물건이름</dt>
                <dd>{post.productName || '—'}</dd>
              </div>

              <div className="detail__meta-row">
                <dt>가격</dt>
                <dd>
                  <strong className="detail__price">{formatPrice(post.price)}</strong>
                  {post.listPrice != null && (
                    <span className="detail__price-was">{formatPrice(post.listPrice)}</span>
                  )}
                </dd>
              </div>

              <div className="detail__meta-row">
                <dt>구매링크</dt>
                <dd>
                  {post.buyUrl ? (
                    <a
                      className="detail__buy"
                      href={post.buyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      원본 상품 페이지 바로가기 <ExternalLinkIcon width={14} height={14} />
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>

              {post.eventNote && (
                <div className="detail__meta-row detail__meta-row--wide">
                  <dt>이벤트</dt>
                  <dd>{post.eventNote}</dd>
                </div>
              )}
            </dl>
          )}

          {post.categories?.length > 0 && (
            <ul className="detail__tags">
              {post.categories.map((c, i) => (
                <li key={c.categoryId} className={`detail__tag ${i === 0 ? 'detail__tag--brand' : ''}`}>
                  {c.name}
                </li>
              ))}
            </ul>
          )}

          <section className="detail__section">
            <h2 className="detail__section-title">상세 설명</h2>
            <div className="detail__content">{post.content}</div>
          </section>

          <CommentSection post={post} onCountChange={handleCommentCountChange} />
        </main>

        <aside className="detail__side">
          <h2 className="detail__side-title">비슷한 상품</h2>
          {related.length === 0 ? (
            <p className="detail__side-empty">아직 비슷한 공구가 없어요.</p>
          ) : (
            <ul className="detail__side-list">
              {related.map((r) => (
                <li key={r.postId}>
                  <Link to={`/posts/${r.postId}`} className="rcard">
                    {r.thumbnailUrl ? (
                      <img className="rcard__thumb" src={r.thumbnailUrl} alt="" />
                    ) : (
                      <span className={`rcard__thumb ph--${placeholderTone(r.postId)}`} />
                    )}
                    <span className="rcard__body">
                      <span className="rcard__name">{r.productName || r.title}</span>
                      <span className="rcard__price">{formatPrice(r.price)}</span>
                      <span className="rcard__meta">
                        {r.participantCount != null ? `${r.participantCount}명 참여 · ` : ''}
                        {ddayLabel(r.endDate)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
