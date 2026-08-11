import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import { CheckIcon, ExternalLinkIcon } from '../components/icons'
import { ddayLabel, formatDate, formatPeriod, placeholderTone } from '../lib/format'
import './MyPage.css'

const TABS = [
  { key: 'posts', label: '내 글' },
  { key: 'saved', label: '저장한 공구' },
  { key: 'alerts', label: '알림 내역' },
]

const LOADERS = {
  posts: () => userApi.myPosts(0),
  saved: () => userApi.mySaves(0),
  alerts: () => userApi.myAlerts(0),
}

export default function MyPage() {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'posts'

  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', instagramUrl: '' })
  const [nickState, setNickState] = useState(null) // null | 'checking' | 'ok' | 'taken'
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    userApi
      .me()
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [])

  function startEdit() {
    setForm({ nickname: profile?.nickname ?? '', instagramUrl: profile?.instagramUrl ?? '' })
    setNickState(null)
    setSaveError(null)
    setEditing(true)
  }

  // 닉네임을 바꿀 때만, 입력이 멈춘 뒤 중복확인을 호출한다. 원래 닉네임 그대로면 확인할 필요가 없다.
  useEffect(() => {
    if (!editing) return
    const value = form.nickname.trim()
    if (!value || value === profile?.nickname) {
      setNickState(null)
      return
    }
    let alive = true
    setNickState('checking')
    const timer = setTimeout(() => {
      userApi
        .checkNickname(value)
        .then((res) => alive && setNickState(res?.available ? 'ok' : 'taken'))
        .catch(() => alive && setNickState(null))
    }, 400)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [form.nickname, editing, profile?.nickname])

  const nicknameChanged = form.nickname.trim() !== '' && form.nickname.trim() !== profile?.nickname
  const canSave = !saving && form.nickname.trim() !== '' && (!nicknameChanged || nickState === 'ok')

  async function saveProfile(e) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await userApi.updateMe({
        nickname: form.nickname.trim(),
        instagramUrl: form.instagramUrl.trim(),
      })
      setProfile(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    LOADERS[tab]()
      .then((page) => alive && setItems(page?.content ?? []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tab])

  return (
    <div className="mypage page">
      <header className="mypage__head">
        <Avatar user={profile ?? user} size={72} />

        <div className="mypage__info">
          <h1 className="mypage__name">{profile?.nickname ?? user?.nickname ?? '회원'}</h1>
          {profile?.email && <p className="mypage__email">{profile.email}</p>}
          {profile?.joinedAt && <p className="mypage__joined">{formatDate(profile.joinedAt)} 가입</p>}
          {profile?.instagramUrl && (
            <a
              className="mypage__instagram"
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              인스타그램 <ExternalLinkIcon width={13} height={13} />
            </a>
          )}
        </div>

        <dl className="mypage__stats">
          <div>
            <dt>게시물</dt>
            <dd>{profile?.postCount ?? 0}</dd>
          </div>
          <div>
            <dt>팔로워</dt>
            <dd>{profile?.followerCount ?? 0}</dd>
          </div>
          <div>
            <dt>팔로잉</dt>
            <dd>{profile?.followingCount ?? 0}</dd>
          </div>
        </dl>

        <div className="mypage__head-actions">
          <button type="button" className="btn btn--ghost" onClick={startEdit}>
            프로필 수정
          </button>
          <button type="button" className="btn btn--ghost mypage__logout" onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      {editing && (
        <form className="mypage__edit-form" onSubmit={saveProfile}>
          <div className="field">
            <span className="field__label">닉네임</span>
            <input
              className={`input ${nickState === 'ok' ? 'input--ok' : ''} ${nickState === 'taken' ? 'input--error' : ''}`}
              type="text"
              value={form.nickname}
              maxLength={50}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
            {nicknameChanged && nickState === 'checking' && <span className="field__help">확인 중...</span>}
            {nicknameChanged && nickState === 'ok' && (
              <span
                className="field__help"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand)' }}
              >
                <CheckIcon width={14} height={14} /> 사용 가능한 닉네임이에요
              </span>
            )}
            {nicknameChanged && nickState === 'taken' && (
              <span className="field__error">이미 사용 중인 닉네임이에요</span>
            )}
          </div>

          <div className="field">
            <span className="field__label">인스타그램 주소</span>
            <input
              className="input"
              type="url"
              placeholder="https://instagram.com/아이디"
              value={form.instagramUrl}
              maxLength={255}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
            />
            <span className="field__help">비워두면 프로필에서 인스타그램 링크가 사라져요.</span>
          </div>

          {saveError && <p className="field__error">{saveError}</p>}

          <div className="mypage__edit-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
              취소
            </button>
            <button type="submit" className="btn btn--primary" disabled={!canSave}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}

      <nav className="mypage__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`mypage__tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setSearchParams({ tab: t.key })}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="state">
          <span className="spinner" />
        </div>
      )}

      {!loading && error && (
        <div className="state">
          <p className="state__title">불러오지 못했어요.</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="state">
          <p className="state__title">
            {tab === 'posts' && '아직 작성한 글이 없어요.'}
            {tab === 'saved' && '저장한 공구가 없어요.'}
            {tab === 'alerts' && '알림 신청한 공구가 없어요.'}
          </p>
          {tab === 'posts' && (
            <Link className="btn btn--primary" to="/write" style={{ marginTop: 12 }}>
              공구 열기
            </Link>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && tab !== 'alerts' && (
        <div className="mypage__grid">
          {items.map((post) => (
            <PostCard key={post.postId} post={post} />
          ))}
        </div>
      )}

      {!loading && !error && items.length > 0 && tab === 'alerts' && (
        <ul className="alerts">
          {items.map((a) => (
            <li key={a.alertId} className="alerts__row">
              {a.thumbnailUrl ? (
                <img className="alerts__thumb" src={a.thumbnailUrl} alt="" />
              ) : (
                <span className={`alerts__thumb ph--${placeholderTone(a.postId)}`} />
              )}

              <div className="alerts__body">
                <Link to={`/posts/${a.postId}`} className="alerts__name">
                  {a.productName || a.title}
                </Link>
                <span className="alerts__period">
                  {formatPeriod(a.startDate, a.endDate)} · {ddayLabel(a.endDate)}
                </span>
              </div>

              {a.buyUrl && (
                <a
                  className="btn btn--ghost alerts__buy"
                  href={a.buyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  구매하러가기 <ExternalLinkIcon width={14} height={14} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
