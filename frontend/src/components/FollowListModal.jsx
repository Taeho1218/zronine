import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { followApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import { CloseIcon } from './icons'
import './FollowListModal.css'

const TABS = [
  { key: 'followers', label: '팔로워', load: followApi.followers },
  { key: 'followings', label: '팔로잉', load: followApi.followings },
]

/**
 * 팔로워 / 팔로잉 목록.
 *
 * 두 목록을 각각 다른 화면으로 만들면 오갈 때마다 프로필을 다시 불러야 해서,
 * 한 창 안에서 탭으로 오가게 했다. 어느 탭으로 열지는 누른 숫자가 정한다.
 */
export default function FollowListModal({ userId, nickname, initialTab = 'followers', onClose }) {
  const { user: me } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 이 창 안에서 팔로우를 눌렀다면 닫을 때 부모가 숫자를 다시 읽도록 알려준다.
  const changed = useRef(false)
  const panelRef = useRef(null)

  const close = () => onClose(changed.current)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    // 창이 떠 있는 동안 뒤 목록이 같이 스크롤되지 않게 막는다.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  })

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    const load = TABS.find((t) => t.key === tab).load
    load(userId, 0)
      .then((page) => alive && setUsers(page?.content ?? []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [userId, tab])

  function updateRow(rowUserId, following) {
    changed.current = true
    setUsers((prev) => prev.map((u) => (u.userId === rowUserId ? { ...u, following } : u)))
  }

  return (
    <div className="fmodal" role="dialog" aria-modal="true" aria-label={`${nickname} 팔로우 목록`}>
      <div className="fmodal__dim" onClick={close} />

      <div className="fmodal__panel" ref={panelRef}>
        <header className="fmodal__head">
          <h2 className="fmodal__title">{nickname}</h2>
          <button type="button" className="fmodal__close" onClick={close} aria-label="닫기">
            <CloseIcon width={18} height={18} />
          </button>
        </header>

        <div className="fmodal__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`fmodal__tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="fmodal__body">
          {loading && (
            <div className="state">
              <span className="spinner" />
            </div>
          )}

          {!loading && error && (
            <div className="state">
              <p className="state__title">목록을 불러오지 못했어요.</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="fmodal__empty">
              {tab === 'followers' ? '아직 팔로워가 없어요.' : '아직 팔로우한 사람이 없어요.'}
            </p>
          )}

          {!loading && !error && users.length > 0 && (
            <ul className="fmodal__list">
              {users.map((u) => (
                <li key={u.userId} className="fmodal__row">
                  <Link to={`/users/${u.userId}`} className="fmodal__user" onClick={close}>
                    <Avatar user={u} size={44} />
                    <span className="fmodal__nickname">{u.nickname}</span>
                  </Link>

                  {/* 내 자신에게는 팔로우 버튼을 두지 않는다 */}
                  {u.userId !== me?.userId && (
                    <FollowButton
                      userId={u.userId}
                      following={u.following}
                      onChange={({ following }) => updateRow(u.userId, following)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
