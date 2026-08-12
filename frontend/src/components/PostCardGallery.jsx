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
        {/* 사진이 있을 때와 똑같이 상세로 가는 링크로 감싼다.
            여기만 클릭이 죽으면 사진 없는 카드는 썸네일 자리가 통째로 안 눌리는 셈이 된다 */}
        <Link to={`/posts/${postId}`} className="pcard__viewport" aria-label={title}>
          <ImageFallback className="imgfallback--card" />
        </Link>
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
            /*
             * 사진은 원본 비율대로 넣어서 위아래(또는 좌우)에 빈 자리가 남는다.
             * 그 자리를 회색으로 두면 카드마다 색이 따로 놀아, 같은 사진을 흐리게 깔아 채운다.
             * 색을 뽑아 계산하지 않고 사진 자체를 쓰는 이유: 다른 도메인 이미지는 canvas 로 픽셀을
             * 읽을 수 없어(CORS) 색 추출이 실패하는데, 이 방법은 어떤 사진이든 그냥 된다.
             */
            <div key={url} className="pcard__slide">
              <img className="pcard__backdrop" src={url} alt="" aria-hidden="true" loading="lazy" />
              <img
                className="pcard__img"
                src={url}
                alt=""
                loading={i === 0 ? 'lazy' : undefined}
                onError={() => setBroken((prev) => new Set(prev).add(url))}
              />
            </div>
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
