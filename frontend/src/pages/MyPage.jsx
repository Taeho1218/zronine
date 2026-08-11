import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import { ExternalLinkIcon } from '../components/icons'
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

  useEffect(() => {
    userApi
      .me()
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [])

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

        <button type="button" className="btn btn--ghost mypage__logout" onClick={logout}>
          로그아웃
        </button>
      </header>

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
