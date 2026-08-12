import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from '../components/Avatar'
import CommentSection from '../components/CommentSection'
import FollowButton from '../components/FollowButton'
import ImageFallback from '../components/ImageFallback'
import Loading from '../components/Loading'
import {
  BellIcon,
  BookmarkIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  TagIcon,
  TrashIcon,
  UserIcon,
  WarningIcon,
} from '../components/icons'
import {
  ddayLabel,
  formatDateDay,
  formatDateTime,
  formatPeriodDay,
  formatPrice,
  PROGRESS_LABEL,
  serverInstant,
} from '../lib/format'
import { useBusy } from '../lib/useBusy'
import './PostDetailPage.css'

/** 사이드바의 "비슷한 상품"은 좁은 칸에 2줄로 놓아 4개까지만 보여준다. */
const SIMILAR_SHOWN = 4

/**
 * "비슷한 상품"이 이 시간을 넘겨도 안 오면 그때 마스코트를 띄운다.
 * 대개는 금방 오는데 곧바로 띄우면 마스코트가 깜빡 나타났다 사라져 더 어수선하다.
 */
const SIMILAR_SLOW_MS = 400

/**
 * 이벤트는 서버에서 자유 문장 한 덩어리(eventNote)로 내려온다.
 * 정해진 구조가 없어서, 실제로 들어오는 세 가지 모양을 순서대로 시도한다.
 *
 *   1. `라벨 | 제목 | 설명` — 한 줄에 하나씩. 글쓰기 화면에서 안내하는 형식이다.
 *   2. 줄바꿈 또는 `1. … 2. …` 번호 — 수집한 공구 글이 대부분 이 모양이다.
 *   3. 그 안에서 `짧은라벨: 내용` 이면 앞부분을 라벨로 뽑는다.
 *
 * 어느 것에도 안 걸리면 통째로 제목 하나가 되고, 비어 있으면 빈 배열이라
 * "공구 이벤트" 칸 자체가 사라진다.
 */

/** "선착순 이벤트: 3명 증정" 처럼 앞에 짧은 이름이 붙은 경우만 라벨로 뗀다. */
function splitLabel(text) {
  const at = text.indexOf(':')
  if (at < 1 || at > 14) return { label: null, title: text }
  const label = text.slice(0, at).trim()
  const rest = text.slice(at + 1).trim()
  // 라벨 자리에 문장이 통째로 오면(마침표·쉼표) 라벨이 아니라 그냥 본문이다.
  if (!rest || /[.,]/.test(label)) return { label: null, title: text }
  return { label, title: rest }
}

function parseEvents(note) {
  if (!note) return []

  const lines = note
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  // 한 줄에 "1. … 2. …" 로 몰아 쓴 경우를 항목별로 다시 쪼갠다.
  const items = lines.flatMap((line) => {
    if (line.includes('|')) return [line]
    // "1." 로 시작할 때만 번호 목록으로 본다. 그래야 본문 속 "3. 5만원" 같은 숫자에 안 걸린다.
    if (!/^1\.\s/.test(line)) return [line]
    const split = line.split(/(?:^|\s)[1-9]\.\s+/).map((s) => s.trim()).filter(Boolean)
    return split.length > 1 ? split : [line]
  })

  return items.map((item) => {
    if (item.includes('|')) {
      const parts = item.split('|').map((s) => s.trim())
      if (parts.length === 2) return { label: parts[0], title: parts[1], desc: null }
      return { label: parts[0], title: parts[1], desc: parts.slice(2).join(' · ') }
    }
    return { ...splitLabel(item), desc: null }
  })
}

/**
 * 남은 시간을 1초마다 다시 그린다.
 * 페이지 전체를 매초 리렌더하면 댓글까지 같이 흔들리므로 이 조각만 따로 떼어 뒀다.
 */
function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  if (!target) return null

  const left = new Date(target).getTime() - now
  if (!Number.isFinite(left) || left <= 0) return <span className="dbuy__due is-over">마감</span>

  const total = Math.floor(left / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  // 하루가 넘게 남으면 시간 자리가 24를 넘어간다 (D-2 라면 47:xx:xx).
  const clock = `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`

  return (
    <span className="dbuy__due">
      {formatDateDay(target)} <strong>{clock}</strong> 남음
    </span>
  )
}

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [post, setPost] = useState(null)
  // 주소가 죽은 이미지는 목록에서 빼버린다. 인덱스는 목록이 줄면 어긋나므로 URL 로 기억한다.
  const [brokenImages, setBrokenImages] = useState(() => new Set())
  const [activeImage, setActiveImage] = useState(0)
  const [related, setRelated] = useState([])
  // 비슷한 상품이 늦게 올 때만 켜진다 (응답이 오거나 화면을 뜨면 다시 꺼진다)
  const [relatedSlow, setRelatedSlow] = useState(false)
  // 응답이 올 때까지 같은 동작을 다시 실행하지 못하게 막는다.
  const [saveBusy, runSave] = useBusy()
  const [alertBusy, runAlert] = useBusy()
  const [deleteBusy, runDelete] = useBusy()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setPost(null)
    // 다른 글로 이동했으면 이전 글의 이미지 상태를 물고 가지 않는다.
    setBrokenImages(new Set())
    setActiveImage(0)
    postApi
      .detail(postId)
      .then((data) => alive && setPost(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [postId])

  // 사이드바 "비슷한 상품": 같은 카테고리 글에서 현재 글만 빼고 몇 개.
  // post 객체 전체를 의존성에 두면 좋아요/저장으로 post 가 갱신될 때마다 다시 부르게 되어
  // 실제로 다시 받아야 하는 값(글 id)만 본다.
  const currentPostId = post?.postId

  /**
   * "비슷한 상품"은 서버가 골라준다 (같은 물건 이름 → 없으면 같은 카테고리).
   * 일반글에는 빈 배열이 오므로, 결과가 있을 때만 자리를 만든다.
   */
  useEffect(() => {
    if (!currentPostId) {
      setRelated([])
      setRelatedSlow(false)
      return undefined
    }
    let alive = true
    // 다른 글로 옮겼으면 이전 글의 추천을 잠깐이라도 새 글 것처럼 보여주지 않는다.
    setRelated([])
    setRelatedSlow(false)
    const slowTimer = setTimeout(() => alive && setRelatedSlow(true), SIMILAR_SLOW_MS)

    function settled() {
      if (!alive) return
      clearTimeout(slowTimer)
      setRelatedSlow(false)
    }

    postApi
      .similar(currentPostId)
      .then((list) => alive && setRelated(list ?? []))
      .catch(() => alive && setRelated([]))
      .finally(settled)

    return () => {
      alive = false
      clearTimeout(slowTimer)
    }
  }, [currentPostId])

  const canShowRelated = related.length > 0

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

  function toggleSave() {
    if (requireLogin()) return
    runSave(async () => {
      const next = !post.saved
      setPost((p) => ({ ...p, saved: next }))
      try {
        if (next) await postApi.save(post.postId)
        else await postApi.unsave(post.postId)
      } catch {
        setPost((p) => ({ ...p, saved: !next }))
      }
    })
  }

  function toggleAlert() {
    if (requireLogin()) return
    runAlert(async () => {
      const next = !post.alerted
      setPost((p) => ({ ...p, alerted: next }))
      try {
        if (next) await postApi.alert(post.postId)
        else await postApi.unalert(post.postId)
      } catch {
        setPost((p) => ({ ...p, alerted: !next }))
      }
    })
  }

  function removePost() {
    if (!window.confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return
    runDelete(async () => {
      try {
        await postApi.remove(post.postId)
        navigate('/')
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  if (loading) {
    return (
      <Loading />
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
  const events = parseEvents(post.eventNote)
  const statusText =
    isSeller && post.progress !== 'NONE'
      ? [PROGRESS_LABEL[post.progress], ddayLabel(post.endDate)].filter(Boolean).join(' · ')
      : null
  // 아직 시작 전이면 마감이 아니라 개시까지를 세는 게 맞다.
  const countdownTarget = post.progress === 'UPCOMING' ? post.startDate : post.endDate
  const countdownLabel = post.progress === 'UPCOMING' ? '시작까지' : '마감까지'

  // 못 불러온 이미지는 빼고 남은 것만 보여준다. 전부 죽었으면 자리표시자로 돌아간다.
  const images = (post.imageUrls ?? []).filter((url) => !brokenImages.has(url))
  const heroIndex = Math.min(activeImage, Math.max(0, images.length - 1))
  const hero = images[heroIndex] ?? null
  const markBroken = (url) => setBrokenImages((prev) => new Set(prev).add(url))
  // 끝에서 한 번 더 누르면 처음으로 돌아온다.
  const step = (delta) => setActiveImage((images.length + heroIndex + delta) % images.length)

  return (
    <div className="detail page">
      <div className="detail__layout">
        <main className="detail__main">
          <header className="detail__author-row">
            <Avatar user={post.author} size={44} />
            <div className="detail__author">
              <span className="detail__author-line">
                <Link to={`/users/${post.author.userId}`} className="detail__author-name">
                  {post.author.nickname}
                </Link>
                {/* 인스타 공구는 주최자 계정으로 확인하는 경우가 많아, 주소가 있으면 바로 열어준다. */}
                {post.author.instagramUrl && (
                  <a
                    className="detail__insta"
                    href={post.author.instagramUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    인스타그램 <ExternalLinkIcon width={12} height={12} />
                  </a>
                )}
              </span>
              {/* 서버가 UTC 로 찍어 보내는 값이라 실제 순간으로 바꿔 읽는다 */}
              <span className="detail__date">{formatDateTime(serverInstant(post.createdAt))}</span>
            </div>

            <div className="detail__head-actions">
              {/* 본인 글에는 팔로우 버튼을 두지 않는다 (서버도 자기 자신 팔로우를 막는다) */}
              {!post.mine && (
                <FollowButton
                  userId={post.author.userId}
                  following={post.followingAuthor}
                  onChange={({ following }) => setPost((prev) => ({ ...prev, followingAuthor: following }))}
                />
              )}
              {isSeller && (
                <button
                  type="button"
                  className={`detail__chip-btn ${post.alerted ? 'is-on' : ''}`}
                  onClick={toggleAlert}
                  disabled={alertBusy}
                >
                  <BellIcon width={17} height={17} />
                  {post.alerted ? '알림 신청됨' : '알림받기'}
                </button>
              )}
              <button
                type="button"
                className={`detail__chip-btn ${post.saved ? 'is-on' : ''}`}
                onClick={toggleSave}
                disabled={saveBusy}
              >
                <BookmarkIcon width={17} height={17} filled={post.saved} />
                {post.saved ? '저장됨' : '저장하기'}
              </button>
              {post.mine && (
                <>
                  <Link to={`/write?edit=${post.postId}`} className="detail__chip-btn">
                    수정
                  </Link>
                  <button
                    type="button"
                    className="detail__chip-btn detail__chip-btn--danger"
                    onClick={removePost}
                    disabled={deleteBusy}
                  >
                    <TrashIcon width={16} height={16} />
                    {deleteBusy ? '삭제 중…' : '삭제'}
                  </button>
                </>
              )}
            </div>
          </header>

          <figure className="detail__hero">
            {/* 사진을 안 올린 글에는 마스코트를 대신 띄운다 */}
            {hero ? (
              <img
                className="detail__hero-img"
                src={hero}
                alt={post.title}
                onError={() => markBroken(hero)}
              />
            ) : (
              <ImageFallback className="imgfallback--hero" />
            )}

            {statusText && (
              <figcaption className="detail__badge">
                <span className="detail__badge-dot" />
                {post.participantCount != null ? `실시간 ${post.participantCount}명 참여 중` : statusText}
              </figcaption>
            )}

            {/* 여러 장일 때만 좌우로 넘기고 현재 위치를 알려준다 */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="detail__nav detail__nav--prev"
                  onClick={() => step(-1)}
                  aria-label="이전 이미지"
                >
                  <ChevronLeftIcon width={20} height={20} />
                </button>
                <button
                  type="button"
                  className="detail__nav detail__nav--next"
                  onClick={() => step(1)}
                  aria-label="다음 이미지"
                >
                  <ChevronRightIcon width={20} height={20} />
                </button>
                <span className="detail__hero-count">
                  {heroIndex + 1} / {images.length}
                </span>
              </>
            )}
          </figure>

          {images.length > 1 && (
            <ul className="detail__thumbs">
              {images.map((url, i) => (
                <li key={url}>
                  <button
                    type="button"
                    className={`detail__thumb ${i === heroIndex ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`${i + 1}번째 이미지 보기`}
                    aria-pressed={i === heroIndex}
                  >
                    <img src={url} alt="" loading="lazy" onError={() => markBroken(url)} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 이벤트를 적어둔 글에만 이 칸이 생긴다 */}
          {events.length > 0 && (
            <section className="detail__section">
              <h2 className="detail__section-title">공구 이벤트</h2>
              <ul className="devent">
                {events.map((ev, i) => (
                  <li key={`${ev.title}-${i}`} className={`devent__card devent__card--${i % 2 === 0 ? 'a' : 'b'}`}>
                    <span className="devent__no">{String(i + 1).padStart(2, '0')}</span>
                    <div className="devent__body">
                      {ev.label && <span className="devent__label">{ev.label}</span>}
                      <p className="devent__title">{ev.title}</p>
                      {ev.desc && <p className="devent__desc">{ev.desc}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="detail__section">
            <h2 className="detail__section-title">상세 설명</h2>
            <div className="detail__content">{post.content}</div>
          </section>

          <CommentSection post={post} onCountChange={handleCommentCountChange} />
        </main>

        <aside className="detail__side">
          <div className="dbuy">
            <h1 className="dbuy__title">{post.title}</h1>
            {statusText && <span className="dbuy__chip">{statusText}</span>}

            <dl className="dbuy__rows">
              {isSeller && countdownTarget && post.progress !== 'ENDED' && (
                <div className="dbuy__row">
                  <dt>
                    <CalendarIcon width={17} height={17} /> {countdownLabel}
                  </dt>
                  <dd>
                    <Countdown target={countdownTarget} />
                  </dd>
                </div>
              )}

              {isSeller && post.startDate && (
                <div className="dbuy__row">
                  <dt>
                    <CalendarIcon width={17} height={17} /> 진행기간
                  </dt>
                  <dd>{formatPeriodDay(post.startDate, post.endDate)}</dd>
                </div>
              )}

              <div className="dbuy__row">
                <dt>
                  <UserIcon width={17} height={17} /> 주최자
                </dt>
                <dd>
                  <Link to={`/users/${post.author.userId}`} className="dbuy__host">
                    {post.author.nickname}
                  </Link>
                </dd>
              </div>

              {isSeller && (
                <div className="dbuy__row">
                  <dt>
                    <TagIcon width={17} height={17} /> 현재 가격
                  </dt>
                  <dd>
                    {/* 수집 단계에서 가격을 못 채운 공구가 있어, 값이 없으면 빈칸 대신 상태를 적어준다. */}
                    {post.price == null ? (
                      <span className="dbuy__muted">가격 미정</span>
                    ) : (
                      <>
                        <strong className="dbuy__price">{formatPrice(post.price)}</strong>
                        {post.listPrice != null && (
                          <span className="dbuy__was">{formatPrice(post.listPrice)}</span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {post.categories?.length > 0 && (
              <dl className="dbuy__sub">
                <div className="dbuy__row">
                  <dt>카테고리</dt>
                  <dd>{post.categories.map((c) => c.name).join(' > ')}</dd>
                </div>
              </dl>
            )}

            {post.buyUrl && (
              <>
                <a className="dbuy__cta" href={post.buyUrl} target="_blank" rel="noreferrer noopener">
                  공구 상품 보러가기
                  <ChevronRightIcon width={18} height={18} />
                </a>
                <p className="dbuy__note">
                  <WarningIcon width={14} height={14} /> 결제 및 배송은 원본 판매 페이지에서 진행됩니다.
                </p>
              </>
            )}
          </div>

          {/*
            응답이 늦으면 자리를 미리 만들어 마스코트를 돌린다.
            결과가 없을 수도 있는 자리라(일반글은 빈 배열) 제목만 먼저 세우고 목록은 나중에 채운다.
          */}
          {relatedSlow && (
            <section className="dsim">
              <div className="dsim__head">
                <h2 className="dsim__title">비슷한 상품</h2>
              </div>
              <Loading size={64} message="비슷한 상품을 찾는 중…" className="dsim__loading" />
            </section>
          )}

          {/* 서버가 골라준 결과가 있을 때만 이 자리를 만든다 */}
          {canShowRelated && (
            <section className="dsim">
              <div className="dsim__head">
                <h2 className="dsim__title">비슷한 상품</h2>
                {post.categories?.length > 0 && (
                  <Link to={`/?categoryId=${post.categories[0].categoryId}`} className="dsim__more">
                    더보기 <ChevronRightIcon width={14} height={14} />
                  </Link>
                )}
              </div>

              <ul className="dsim__grid">
                {related.slice(0, SIMILAR_SHOWN).map((r) => (
                  <li key={r.postId}>
                    <Link to={`/posts/${r.postId}`} className="rcard">
                      <span className="rcard__thumb">
                        {r.thumbnailUrl ? (
                          <img src={r.thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          <ImageFallback className="imgfallback--fill" />
                        )}
                      </span>
                      <span className="rcard__name">{r.productName || r.title}</span>
                      <span className="rcard__foot">
                        <span className={`rcard__price ${r.price == null ? 'is-empty' : ''}`}>
                          {r.price == null ? '가격 미정' : formatPrice(r.price)}
                        </span>
                        <span className="rcard__like">
                          <HeartIcon width={15} height={15} filled={r.liked} />
                          {r.likeCount > 0 && r.likeCount}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
