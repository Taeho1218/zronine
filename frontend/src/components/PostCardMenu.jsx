import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import './PostCardMenu.css'

/**
 * 카드 오른쪽 위의 점 3개 메뉴. 지금은 신고하기 하나만 들어 있다.
 *
 * 카드 전체가 상세 페이지로 가는 링크라, 이 버튼은 링크 바깥에 두고 위에 얹는다.
 * (링크 안에 버튼을 넣으면 잘못된 마크업이 되고 클릭이 이동과 겹친다)
 */
export default function PostCardMenu({ postId }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reported, setReported] = useState(false)
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

  /**
   * 신고 접수.
   *
   * 서버에 신고 엔드포인트가 없어 화면에서만 처리한다.
   * 브라우저를 새로고침하면 표시가 사라지고, 운영자에게 전달되지도 않는다.
   * 실제로 접수하려면 서버에 API 를 만들고 여기서 호출하면 된다.
   */
  function report() {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/posts/${postId}` } })
      return
    }
    setReported(true)
    setOpen(false)
    window.alert('신고가 완료되었습니다. 감사합니다.')
  }

  return (
    <div className="pcardmenu" ref={rootRef}>
      <button
        type="button"
        className={`pcardmenu__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="게시글 메뉴"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="pcardmenu__panel" role="menu">
          <button
            type="button"
            className="pcardmenu__item pcardmenu__item--danger"
            role="menuitem"
            onClick={report}
            disabled={reported}
          >
            {reported ? '신고함' : '신고하기'}
          </button>
        </div>
      )}

      {reported && !open && <span className="pcardmenu__flag">신고 접수됨</span>}
    </div>
  )
}
