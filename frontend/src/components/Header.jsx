import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import NotificationPanel from './NotificationPanel'
import { MIN_KEYWORD_LENGTH } from '../lib/search'
import { fetchNotifications } from '../lib/notifications'
import { BellIcon, BookmarkIcon, SearchIcon } from './icons'
import symbolUrl from '../assets/brand/gg_symbol.svg'
import './Header.css'

export default function Header() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [hint, setHint] = useState(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef(null)

  /**
   * 종 아이콘의 빨간 점 표시용.
   * 패널을 열고 닫을 때마다 다시 세어, 안에서 읽음 처리한 결과가 바로 반영되게 한다.
   */
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0)
      return undefined
    }
    let alive = true
    fetchNotifications()
      .then((list) => alive && setUnreadCount(list.filter((n) => n.unread).length))
      .catch(() => alive && setUnreadCount(0))
    return () => {
      alive = false
    }
  }, [isLoggedIn, alertOpen])

  // 홈에서 검색어가 지워지면(칩 클릭 등) 입력창도 같이 비운다.
  useEffect(() => {
    setKeyword(searchParams.get('keyword') ?? '')
  }, [searchParams])

  function changeKeyword(value) {
    setKeyword(value)
    // 글자를 더 채우는 순간 안내를 거둔다. 계속 띄워두면 잔소리처럼 보인다.
    if (hint && value.trim().length >= MIN_KEYWORD_LENGTH) setHint(null)
  }

  function submitSearch(e) {
    e.preventDefault()
    const q = keyword.trim()

    // 빈 검색은 "검색 해제"로 본다. 한 글자만 남은 경우에만 막고 이유를 알려준다.
    if (q.length > 0 && q.length < MIN_KEYWORD_LENGTH) {
      setHint(`검색어를 ${MIN_KEYWORD_LENGTH}자 이상 입력해주세요.`)
      return
    }

    setHint(null)
    navigate(q ? `/?keyword=${encodeURIComponent(q)}` : '/')
  }

  return (
    <header className="header">
      <div className="header__inner">
        {/* 헤더는 높이가 낮아 "함께 사요" 태그라인까지 넣으면 글씨가 뭉개진다.
            로고 락업의 윗줄(심볼 + ㄱㄱ)만 떼어 쓰고, 전체 락업은 로그인/회원가입 화면에서 보여준다. */}
        <Link to="/" className="header__logo" aria-label="ㄱㄱ 홈">
          <img className="header__logo-mark" src={symbolUrl} alt="" />
          <span className="header__logo-text">ㄱㄱ</span>
        </Link>

        <form className="header__search" onSubmit={submitSearch} role="search">
          <SearchIcon className="header__search-icon" />
          <input
            className={`header__search-input ${hint ? 'is-invalid' : ''}`}
            type="search"
            value={keyword}
            onChange={(e) => changeKeyword(e.target.value)}
            onBlur={() => setHint(null)}
            placeholder="검색어를 2자 이상 입력하세요"
            aria-label="공구 검색"
            aria-invalid={!!hint}
          />
          {hint && (
            <p className="header__search-hint" role="alert">
              {hint}
            </p>
          )}
        </form>

        <nav className="header__actions">
          <div className="header__bell-wrap" ref={bellRef}>
            <button
              type="button"
              className={`header__icon-btn ${alertOpen ? 'is-active' : ''}`}
              onClick={() => setAlertOpen((v) => !v)}
              aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : '알림'}
              aria-expanded={alertOpen}
            >
              <BellIcon width={22} height={22} />
              {/* 읽지 않은 알림이 있을 때만 찍히는 빨간 점 */}
              {unreadCount > 0 && <span className="header__badge" />}
            </button>
            {alertOpen && <NotificationPanel anchorRef={bellRef} onClose={() => setAlertOpen(false)} />}
          </div>

          <Link to="/saved" className="header__icon-btn" aria-label="저장한 공구">
            <BookmarkIcon width={22} height={22} />
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/write" className="header__write">
                글쓰기
              </Link>
              <Link to="/mypage" className="header__cta">
                마이페이지
              </Link>
            </>
          ) : (
            <Link to="/login" className="header__cta">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
