import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import Loading from './Loading'
import { fetchNotifications, markRead } from '../lib/notifications'
import { fromNow } from '../lib/format'
import ImageFallback from './ImageFallback'
import { CheckIcon, ClockIcon, CloseIcon, ExternalLinkIcon } from './icons'
import './NotificationPanel.css'

/**
 * 종 아이콘을 눌렀을 때 내려오는 알림 목록.
 *
 * 여기 뜨는 것은 내가 알림 신청한 공구의 진행 상태뿐이다. 댓글·좋아요 알림은 서버에 원본
 * 데이터가 없어 만들 수 없고, 빈 탭으로 자리만 잡아두면 오지 않는 알림을 기다리게 된다.
 * 그래서 종류를 나누는 탭 없이 공구 알림만 보여준다.
 */
export default function NotificationPanel({ anchorRef, onClose }) {
  const { isLoggedIn } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  // 패널 밖 클릭 / ESC 로 닫기
  useEffect(() => {
    function onPointerDown(e) {
      if (panelRef.current?.contains(e.target)) return
      if (anchorRef?.current?.contains(e.target)) return
      onClose()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [anchorRef, onClose])

  useEffect(() => {
    let alive = true
    if (!isLoggedIn) {
      setLoading(false)
      return () => {}
    }
    fetchNotifications()
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [isLoggedIn])

  const unreadCount = items.filter((n) => n.unread).length

  function readAll() {
    markRead(items.map((n) => n.id))
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  function readOne(id) {
    markRead([id])
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  return (
    <div className="npanel" ref={panelRef} role="dialog" aria-label="알림">
      <div className="npanel__head">
        <h2 className="npanel__title">
          알림 {unreadCount > 0 && <span className="npanel__count">{unreadCount}</span>}
        </h2>
        <div className="npanel__head-actions">
          <button type="button" className="npanel__read-all" onClick={readAll} disabled={!unreadCount}>
            모두 읽음
          </button>
          <button type="button" className="npanel__close" onClick={onClose} aria-label="알림 닫기">
            <CloseIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <div className="npanel__body">
        {!isLoggedIn && <p className="npanel__empty">로그인하면 알림을 받아볼 수 있어요.</p>}

        {isLoggedIn && loading && <Loading size={72} message="알림을 불러오는 중…" className="npanel__loading" />}

        {isLoggedIn && !loading && items.length === 0 && (
          <p className="npanel__empty">새로운 알림이 없어요.</p>
        )}

        {isLoggedIn && !loading && items.length > 0 && (
          <ul className="npanel__list">
            {items.map((n) => (
              <li key={n.id} className={`npanel__item ${n.unread ? 'is-unread' : ''}`}>
                <Link className="npanel__link" to={`/posts/${n.postId}`} onClick={() => { readOne(n.id); onClose() }}>
                  <span className={`npanel__icon npanel__icon--${n.icon}`}>
                    {n.icon === 'check' ? <CheckIcon width={16} height={16} /> : <ClockIcon width={16} height={16} />}
                  </span>

                  <span className="npanel__text">
                    <span className="npanel__message">{n.text}</span>
                    <span className="npanel__time">{fromNow(n.createdAt)}</span>
                  </span>

                  {n.thumbnailUrl ? (
                    <img className="npanel__thumb" src={n.thumbnailUrl} alt="" />
                  ) : (
                    <ImageFallback size={38} />
                  )}

                  {n.unread && <span className="npanel__dot" aria-label="읽지 않음" />}
                </Link>

                {n.buyUrl && (
                  <a className="npanel__buy" href={n.buyUrl} target="_blank" rel="noreferrer noopener">
                    구매링크 확인 <ExternalLinkIcon width={13} height={13} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
