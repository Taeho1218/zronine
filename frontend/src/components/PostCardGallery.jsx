import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageFallback from './ImageFallback'
import './PostCardGallery.css'

/** 마우스를 올려두면 이 간격으로 다음 장으로 넘어간다. */
const AUTOPLAY_MS = 1600

/**
 * 카드 썸네일 자리. 사진이 여러 장이면 넘겨볼 수 있는 캐러셀이 된다.
 *
 * 화살표를 Link 안에 두면 <a> 안에 <button> 이 들어가 잘못된 마크업이 되고
 * 클릭이 상세 페이지 이동과 겹친다. 그래서 이미지만 Link 로 감싸고
 * 화살표와 점은 그 위에 얹는 형제로 둔다.
 */
export default function PostCardGallery({ postId, images, title, badgeLabel = '' }) {
  const [broken, setBroken] = useState(() => new Set())
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)

  // 주소가 죽은 사진은 빼고 남은 것만 넘긴다.
  const slides = useMemo(() => (images ?? []).filter((url) => !broken.has(url)), [images, broken])
  const total = slides.length
  const current = total > 0 ? index % total : 0

  // 사진이 줄어들어 현재 위치가 범위를 벗어나면 앞으로 당긴다.
  useEffect(() => {
    if (index >= total && total > 0) setIndex(0)
  }, [index, total])

  // 올려둔 동안에만 자동으로 넘어간다. 벗어나면 그 자리에 멈춘다.
  useEffect(() => {
    if (!hovering || total <= 1) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [hovering, total])

  if (total === 0) {
    return (
      <div className="pcard__media">
        <ImageFallback className="imgfallback--card" />
        {badgeLabel && (
          <span className="pcard__dday">
            <span className="pcard__dday-dot" aria-hidden="true" />
            {badgeLabel}
          </span>
        )}
      </div>
    )
  }

  const go = (next) => setIndex(((next % total) + total) % total)

  return (
    <div
      className="pcard__media"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link to={`/posts/${postId}`} className="pcard__viewport" aria-label={title}>
        <div className="pcard__track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((url, i) => (
            <img
              key={url}
              className="pcard__img"
              src={url}
              alt=""
              loading={i === 0 ? 'lazy' : undefined}
              onError={() => setBroken((prev) => new Set(prev).add(url))}
            />
          ))}
        </div>
      </Link>

      {badgeLabel && (
        <span className="pcard__dday">
          <span className="pcard__dday-dot" aria-hidden="true" />
          {badgeLabel}
        </span>
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            className="pcard__nav pcard__nav--prev"
            onClick={() => go(current - 1)}
            aria-label="이전 사진"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            className="pcard__nav pcard__nav--next"
            onClick={() => go(current + 1)}
            aria-label="다음 사진"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <ul className="pcard__dots" aria-hidden="true">
            {slides.map((url, i) => (
              <li key={url} className={`pcard__dot ${i === current ? 'is-current' : ''}`} />
            ))}
          </ul>

          <span className="sr-only" aria-live="polite">
            사진 {current + 1} / {total}
          </span>
        </>
      )}
    </div>
  )
}
