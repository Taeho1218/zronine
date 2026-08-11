import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { formatPeriod, formatPrice } from '../lib/format'
import { useBusy } from '../lib/useBusy'
import PostCardGallery from './PostCardGallery'
import PostCardMenu from './PostCardMenu'
import { BookmarkIcon, CommentIcon, HeartIcon } from './icons'
import './PostCard.css'

/**
 * 메인 피드의 카드 한 장.
 *
 * 추천/저장은 서버 응답을 기다리지 않고 먼저 화면을 바꾼 뒤(낙관적 갱신)
 * 실패하면 직전 값으로 되돌린다. 목록에서 연타했을 때 버튼이 늦게 반응하는 느낌을 없애기 위함이다.
 */
export default function PostCard({ post }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [saved, setSaved] = useState(post.saved)
  // 응답이 올 때까지 같은 버튼을 다시 누르지 못하게 막는다 (추천/저장 각각 따로).
  const [likeBusy, runLike] = useBusy()
  const [saveBusy, runSave] = useBusy()

  function requireLogin() {
    if (isLoggedIn) return false
    navigate('/login', { state: { from: `/posts/${post.postId}` } })
    return true
  }

  function toggleLike(e) {
    e.preventDefault()
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

  function toggleSave(e) {
    e.preventDefault()
    if (requireLogin()) return
    runSave(async () => {
      const next = !saved
      setSaved(next)
      try {
        if (next) await postApi.save(post.postId)
        else await postApi.unsave(post.postId)
      } catch {
        setSaved(!next)
      }
    })
  }

  // 목록 응답에는 대표 썸네일과 전체 이미지가 함께 온다.
  // 전체가 비어 있는 옛 응답도 있을 수 있어 썸네일 하나라도 있으면 그것으로 채운다.
  const images = post.imageUrls?.length ? post.imageUrls : post.thumbnailUrl ? [post.thumbnailUrl] : []
  const isSeller = post.postType === 'SELLER'
  const period = formatPeriod(post.startDate, post.endDate)

  return (
    <article className="pcard">
      {/* 카드 링크 바깥에 두어야 눌렀을 때 상세로 이동하지 않는다 */}
      <PostCardMenu postId={post.postId} />

      {/* 사진이 여러 장이면 넘겨볼 수 있고, 없으면 마스코트가 자리를 채운다 */}
      <PostCardGallery postId={post.postId} images={images} title={post.title} />

      <Link to={`/posts/${post.postId}`} className="pcard__link">
        {post.categories?.length > 0 && (
          <ul className="pcard__cats">
            {post.categories.map((c) => (
              <li key={c.categoryId} className="pcard__cat">
                {c.name}
              </li>
            ))}
          </ul>
        )}

        {/* 제목 자리 높이를 고정해두고 그 안에서 세로 가운데로 맞춘다.
            한 줄짜리와 두 줄짜리 제목이 섞여도 카드마다 아래 내용이 같은 높이에서 시작한다. */}
        <div className="pcard__title-box">
          <h3 className="pcard__title">{post.title}</h3>
        </div>

        {/* 일반글에는 기간도 가격도 없어 이 줄 자체를 그리지 않는다 */}
        {(period || isSeller) && (
          <div className="pcard__meta">
            {period && <span className="pcard__period">{period}</span>}
            <span className={`pcard__price ${post.price == null ? 'pcard__price--empty' : ''}`}>
              {post.price == null ? '가격 미정' : formatPrice(post.price)}
            </span>
          </div>
        )}
      </Link>

      <div className="pcard__footer">
        <div className="pcard__stats">
          <button
            type="button"
            className={`pcard__action ${liked ? 'is-on' : ''}`}
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
          >
            <HeartIcon width={17} height={17} filled={liked} />
            추천 {likeCount}
          </button>
          <Link to={`/posts/${post.postId}#comments`} className="pcard__action">
            <CommentIcon width={17} height={17} />
            댓글 {post.commentCount}
          </Link>
        </div>

        <button
          type="button"
          className={`pcard__action ${saved ? 'is-on' : ''}`}
          onClick={toggleSave}
          disabled={saveBusy}
          aria-pressed={saved}
        >
          <BookmarkIcon width={17} height={17} filled={saved} />
          저장하기
        </button>
      </div>
    </article>
  )
}
