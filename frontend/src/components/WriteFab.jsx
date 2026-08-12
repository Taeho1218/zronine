import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { PlusIcon } from './icons'
import './WriteFab.css'

/**
 * 어느 화면에서든 오른쪽 아래에 떠 있는 글쓰기 버튼.
 *
 * 헤더의 "글쓰기" 링크는 목록을 한참 내려본 뒤에는 스크롤을 되감아야 닿는다.
 * 글을 쓰고 싶어지는 건 대개 남의 글을 보다가라서, 화면에 고정된 입구를 따로 둔다.
 *
 * 누를 때 글 종류를 먼저 고르게 하는 이유: 글쓰기 화면에도 같은 선택이 있지만
 * (PostWritePage 의 segmented) 기본값이 셀러라, 유저글을 쓰려던 사람은 셀러용 폼이
 * 그려진 걸 보고 한 번 되짚어야 한다. 들어가기 전에 고르면 그 헛걸음이 없다.
 */
export default function WriteFab() {
  const { isLoggedIn } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  /*
   * 글을 쓰는 중에는 띄우지 않는다. 폼 위에 겹쳐 앉는 것도 문제지만,
   * 글 종류는 그 화면 안에서 바꾸는 값이라 여기서 또 고르면 같은 주소로 다시 들어가면서
   * 방금 쓰던 내용이 날아간 것처럼 보인다.
   */
  const onWritePage = pathname === '/write'

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

  // 화면을 옮기면 열어둔 메뉴는 닫는다 (뒤로가기로 돌아왔을 때 그대로 펼쳐져 있으면 어색하다)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // 헤더의 "글쓰기" 와 같은 규칙으로, 로그인한 사람에게만 보인다.
  if (onWritePage || !isLoggedIn) return null

  function go(type) {
    setOpen(false)
    navigate(`/write?type=${type}`)
  }

  return (
    <div className="writefab" ref={rootRef}>
      {open && (
        <div className="writefab__menu" role="menu" aria-label="글 종류 선택">
          <button type="button" role="menuitem" className="writefab__item" onClick={() => go('SELLER')}>
            <span className="writefab__item-label">셀러로 글쓰기</span>
            <span className="writefab__item-desc">공구를 열고 참여자를 모아요</span>
          </button>
          <button type="button" role="menuitem" className="writefab__item" onClick={() => go('GENERAL')}>
            <span className="writefab__item-label">유저로 글쓰기</span>
            <span className="writefab__item-desc">자유롭게 이야기를 나눠요</span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`writefab__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? '글쓰기 메뉴 닫기' : '글쓰기'}
      >
        <PlusIcon width={26} height={26} strokeWidth={2.2} />
      </button>
    </div>
  )
}
