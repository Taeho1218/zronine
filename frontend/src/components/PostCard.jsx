import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import ImageFallback from './ImageFallback'
import { BookmarkIcon, HeartIcon } from './icons'
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

  // 이미지 주소가 죽어 있으면(데모 파일 누락, 삭제된 업로드 등) 깨진 아이콘 대신
  // 원래의 파스텔 자리표시자로 돌려놓는다.
  const [imageBroken, setImageBroken] = useState(false)
  const thumb = post.thumbnailUrl ?? post.imageUrls?.[0] ?? null
  const showImage = thumb && !imageBroken

  return (
    <article className="pcard">
      <Link to={`/posts/${post.postId}`} className="pcard__link">
        {/* 사진을 안 올린 글에는 마스코트를 대신 띄운다 */}
        <div className="pcard__media">
          {showImage ? (
            <img
              className="pcard__img"
              src={thumb}
              alt=""
              loading="lazy"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <ImageFallback className="imgfallback--card" />
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
            disabled={likeBusy}
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
