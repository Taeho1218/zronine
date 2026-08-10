import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { placeholderTone } from '../lib/format'
import { BookmarkIcon, HeartIcon, ImageIcon } from './icons'
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

  function requireLogin() {
    if (isLoggedIn) return false
    navigate('/login', { state: { from: `/posts/${post.postId}` } })
    return true
  }

  async function toggleLike(e) {
    e.preventDefault()
    if (requireLogin()) return
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
  }

  async function toggleSave(e) {
    e.preventDefault()
    if (requireLogin()) return
    const next = !saved
    setSaved(next)
    try {
      if (next) await postApi.save(post.postId)
      else await postApi.unsave(post.postId)
    } catch {
      setSaved(!next)
    }
  }

  const thumb = post.thumbnailUrl ?? post.imageUrls?.[0] ?? null

  return (
    <article className="pcard">
      <Link to={`/posts/${post.postId}`} className="pcard__link">
        <div className="pcard__media">
          {thumb ? (
            <img className="pcard__img" src={thumb} alt="" loading="lazy" />
          ) : (
            <div className={`pcard__img pcard__img--empty ph--${placeholderTone(post.postId)}`}>
              <ImageIcon width={30} height={30} />
            </div>
          )}
        </div>
        <h3 className="pcard__title">{post.title}</h3>
      </Link>

      <div className="pcard__footer">
        <div className="pcard__stats">
          <button
            type="button"
            className={`pcard__action ${liked ? 'is-on' : ''}`}
            onClick={toggleLike}
            aria-pressed={liked}
          >
            <HeartIcon width={17} height={17} filled={liked} />
            추천 {likeCount}
          </button>
          <Link to={`/posts/${post.postId}#comments`} className="pcard__action">
            댓글 {post.commentCount}
          </Link>
        </div>

        <button
          type="button"
          className={`pcard__action ${saved ? 'is-on' : ''}`}
          onClick={toggleSave}
          aria-pressed={saved}
        >
          <BookmarkIcon width={17} height={17} filled={saved} />
          저장하기
        </button>
      </div>
    </article>
  )
}
