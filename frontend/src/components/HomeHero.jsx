import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postApi } from '../api'
import { formatPeriod } from '../lib/format'
import ImageFallback from './ImageFallback'
import './HomeHero.css'

/** 자동으로 다음 묶음으로 넘어가는 간격 */
const AUTOPLAY_MS = 2500

/** CSS 의 transform transition 시간과 맞춘다 */
const SLIDE_MS = 450

/**
 * 한 번에 보이는 장 수에 맞춘 한 장의 비율.
 *
 * 배너 띠의 높이는 "한 장의 폭 x 비율" 이라, 비율을 그대로 두고 장 수만 줄이면
 * 화면이 좁을수록 배너가 급격히 높아진다(1200 에서 384px 이던 띠가 640 에서 640px 이 된다).
 * 그래서 3장·2장일 때 띠 높이가 모두 폭의 1/3 이 되도록 비율을 함께 바꾼다.
 * 한 장만 보이는 폭에서는 1/3 이 너무 납작해서 4:3 으로 조금 높인다.
 */
const SLIDE_RATIO = { 1: '4 / 3', 2: '3 / 2', 3: '1 / 1' }

/**
 * 화면 폭에 따라 한 번에 몇 장을 보여줄지.
 *
 * 이 값을 CSS 미디어쿼리로만 정하면 슬라이드를 미는 계산(JS)과 어긋나 화면이 중간에서 멈춘다.
 * 그래서 여기서 한 번만 정하고 폭·이동량 모두 이 값에서 뽑아 쓴다.
 */
function usePerView() {
  const read = () => {
    if (typeof window === 'undefined') return 3
    if (window.matchMedia('(max-width: 640px)').matches) return 1
    if (window.matchMedia('(max-width: 1024px)').matches) return 2
    return 3
  }

  const [perView, setPerView] = useState(read)

  useEffect(() => {
    const onResize = () => setPerView(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return perView
}

export default function HomeHero() {
  const [banners, setBanners] = useState([])
  const [page, setPage] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const perView = usePerView()

  // 좋아요 → 댓글 → 최신 순 정렬과 "마감된 공구 제외"는 서버(GET /api/posts/popular)가 처리한다.
  useEffect(() => {
    let alive = true
    postApi
      .popular()
      .then((list) => alive && setBanners(list ?? []))
      .catch(() => alive && setBanners([]))
    return () => {
      alive = false
    }
  }, [])

  // 묶음이 딱 떨어지도록 남는 장은 잘라낸다. 마지막 묶음이 덜 차면 순환이 어색해진다.
  const pageCount = Math.floor(banners.length / perView)
  const visible = banners.slice(0, pageCount * perView)

  /**
   * 끝에서 처음으로 돌아갈 때도 오른쪽으로 계속 미는 것처럼 보이게 한다.
   *
   * 맨 앞 묶음을 뒤에 한 벌 복제해두고, 마지막 다음 칸(=복제본)까지 평소처럼 밀고 간다.
   * 화면상 첫 묶음과 똑같아 보이는 그 순간에 애니메이션을 끄고 진짜 0번으로 돌려놓으면
   * 되돌아가는 움직임이 보이지 않는다.
   */
  const slides = pageCount > 1 ? [...visible, ...visible.slice(0, perView)] : visible

  useEffect(() => {
    if (paused || pageCount <= 1) return undefined
    const timer = setInterval(() => setPage((p) => p + 1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, pageCount])

  // 복제본 자리에 도착했으면 애니메이션 없이 원래 첫 칸으로 되돌려 놓는다.
  useEffect(() => {
    if (page !== pageCount || pageCount <= 1) return undefined
    const timer = setTimeout(() => {
      setAnimate(false)
      setPage(0)
    }, SLIDE_MS)
    return () => clearTimeout(timer)
  }, [page, pageCount])

  // 순간이동을 마친 다음 프레임에 애니메이션을 다시 켠다.
  useEffect(() => {
    if (animate) return undefined
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [animate])

  if (visible.length === 0) return null

  function goPrev() {
    if (page > 0) {
      setPage(page - 1)
      return
    }
    // 첫 칸에서 뒤로 갈 때도 같은 방식으로. 복제본 자리로 순간이동한 뒤 왼쪽으로 민다.
    setAnimate(false)
    setPage(pageCount)
    requestAnimationFrame(() => requestAnimationFrame(() => setPage(pageCount - 1)))
  }

  return (
    <section
      className="hero"
      aria-label="인기 공구"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero__viewport">
        <div
          className="hero__track"
          style={{
            transform: `translateX(-${page * 100}%)`,
            transition: animate ? undefined : 'none',
          }}
        >
          {slides.map((post, i) => {
            const image = post.thumbnailUrl ?? post.imageUrls?.[0] ?? null
            const period = formatPeriod(post.startDate, post.endDate)
            return (
              <Link
                key={`${post.postId}-${i}`}
                to={`/posts/${post.postId}`}
                className="hero__slide"
                style={{ flexBasis: `${100 / perView}%`, aspectRatio: SLIDE_RATIO[perView] ?? '1 / 1' }}
              >
                {image ? (
                  <img className="hero__img" src={image} alt="" />
                ) : (
                  <ImageFallback className="hero__img hero__img--empty" />
                )}

                {/*
                  배너 아래쪽 배치
                    제목
                    이름   기간
                */}
                <div className="hero__caption">
                  <strong className="hero__title">{post.productName || post.title}</strong>

                  <div className="hero__row">
                    <span className="hero__seller">{post.author?.nickname}</span>
                    {period && <span className="hero__period">{period}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {pageCount > 1 && (
        <>
          <button type="button" className="hero__nav hero__nav--prev" onClick={goPrev} aria-label="이전 배너">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            className="hero__nav hero__nav--next"
            onClick={() => setPage(page + 1)}
            aria-label="다음 배너"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  )
}
