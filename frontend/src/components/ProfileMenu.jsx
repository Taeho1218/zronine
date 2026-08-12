import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import Avatar from './Avatar'
import './ProfileMenu.css'

/**
 * 헤더 오른쪽 끝의 내 프로필 버튼. 누르면 마이페이지·로그아웃이 나온다.
 *
 * 링크를 헤더에 그대로 늘어놓으면 좁은 화면에서 검색창을 밀어내고, 로그아웃은 설정 화면까지
 * 들어가야 있었다. 얼굴(아바타)은 어디서든 "내 것" 자리로 읽히므로 그 아래로 접어둔다.
 */
export default function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [loggingOut, runLogout] = useBusy()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // 화면을 옮기면 닫는다 (뒤로가기로 돌아왔을 때 펼쳐진 채로 있으면 어색하다)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  function handleLogout() {
    runLogout(async () => {
      await logout()
      setOpen(false)
      // 로그인이 있어야 보이는 화면에 머물러 있을 수 있어 홈으로 보낸다
      navigate('/')
    })
  }

  return (
    <div className="pmenu" ref={rootRef}>
      <button
        type="button"
        className={`pmenu__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? '내 메뉴 닫기' : '내 메뉴'}
      >
        <Avatar user={user} size={36} />
      </button>

      {open && (
        <div className="pmenu__panel" role="menu">
          {/* 계정이 여러 개인 사람도 어느 쪽으로 들어가는지 바로 알 수 있게 이름을 얹는다 */}
          <p className="pmenu__who">{user?.nickname ?? '회원'}</p>

          <Link to="/mypage" role="menuitem" className="pmenu__item" onClick={() => setOpen(false)}>
            마이페이지
          </Link>

          <button
            type="button"
            role="menuitem"
            className="pmenu__item pmenu__item--danger"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  )
}
