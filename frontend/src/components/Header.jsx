import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import NotificationPanel from './NotificationPanel'
import { BellIcon, BookmarkIcon, SearchIcon } from './icons'
import symbolUrl from '../assets/gg_symbol.svg'
import './Header.css'

export default function Header() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [alertOpen, setAlertOpen] = useState(false)
  const bellRef = useRef(null)

  // 홈에서 검색어가 지워지면(칩 클릭 등) 입력창도 같이 비운다.
  useEffect(() => {
    setKeyword(searchParams.get('keyword') ?? '')
  }, [searchParams])

  function submitSearch(e) {
    e.preventDefault()
    const q = keyword.trim()
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
            className="header__search-input"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색"
            aria-label="공구 검색"
          />
        </form>

        <nav className="header__actions">
          <div className="header__bell-wrap" ref={bellRef}>
            <button
              type="button"
              className={`header__icon-btn ${alertOpen ? 'is-active' : ''}`}
              onClick={() => setAlertOpen((v) => !v)}
              aria-label="알림"
              aria-expanded={alertOpen}
            >
              <BellIcon width={22} height={22} />
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
