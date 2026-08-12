import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import PostCard from '../components/PostCard'
import ImageFallback from '../components/ImageFallback'
import Loading from '../components/Loading'
import ProfileHeader from '../components/ProfileHeader'
import FollowListModal from '../components/FollowListModal'
import { ExternalLinkIcon, SettingsIcon, TrashIcon } from '../components/icons'
import { ddayLabel, formatPeriod, fromNow } from '../lib/format'
import { draftTitle, listDrafts, removeDraft } from '../lib/drafts'
import './MyPage.css'

const TABS = [
  { key: 'posts', label: '게시글' },
  { key: 'drafts', label: '임시저장' },
  { key: 'saved', label: '저장한 공구' },
  { key: 'alerts', label: '알림 내역' },
]

const LOADERS = {
  posts: () => userApi.myPosts(0),
  saved: () => userApi.mySaves(0),
  alerts: () => userApi.myAlerts(0),
}

export default function MyPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'posts'

  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  // 임시저장은 이 브라우저 안에만 있다. 탭 옆 개수를 항상 띄우려고 처음부터 읽어둔다.
  const [drafts, setDrafts] = useState(() => listDrafts(user?.userId))
  // 커버를 안 올렸을 때 대신 깔 사진. 탭을 옮겨도 커버가 바뀌지 않도록 "내 글"에서만 갱신한다.
  const [coverFallback, setCoverFallback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // null 이면 닫힌 상태, 'followers' | 'followings' 면 그 탭으로 열린다.
  const [followTab, setFollowTab] = useState(null)

  /** 목록 창에서 팔로우를 눌렀으면 프로필의 숫자도 다시 읽어 맞춘다. */
  function closeFollowList(changed) {
    setFollowTab(null)
    if (changed) userApi.me().then(setProfile).catch(() => {})
  }

  useEffect(() => {
    userApi
      .me()
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [])

  /** 임시저장은 서버가 아니라 이 브라우저에 있어서 기다릴 것 없이 바로 읽는다. */
  function reloadDrafts() {
    setDrafts(listDrafts(user?.userId))
  }

  function deleteDraft(draftId) {
    if (!window.confirm('임시저장한 글을 지울까요? 되돌릴 수 없습니다.')) return
    removeDraft(draftId)
    reloadDrafts()
  }

  useEffect(() => {
    let alive = true
    setError(null)

    // 다른 탭을 보는 동안 글쓰기 화면에서 저장하고 왔을 수 있으니 들어올 때마다 다시 읽는다.
    if (tab === 'drafts') {
      reloadDrafts()
      setLoading(false)
      return undefined
    }

    setLoading(true)
    LOADERS[tab]()
      .then((page) => {
        if (!alive) return
        const list = page?.content ?? []
        setItems(list)
        if (tab === 'posts') setCoverFallback(list.find((p) => p.thumbnailUrl)?.thumbnailUrl ?? null)
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tab])

  // 임시저장 탭만 서버 목록이 아니라 브라우저에 담아둔 목록을 그린다
  const shown = tab === 'drafts' ? drafts : items

  return (
    /* 커버가 화면 끝까지 깔려야 해서 헤더만 .page 바깥에 둔다 */
    <>
      <ProfileHeader
        profile={profile ?? { nickname: user?.nickname ?? '회원', userId: user?.userId }}
        onOpenFollowers={() => setFollowTab('followers')}
        onOpenFollowings={() => setFollowTab('followings')}
        fallbackCover={coverFallback}
        topRight={
          <Link to="/settings" aria-label="환경설정">
            <SettingsIcon width={16} height={16} />
            환경설정
          </Link>
        }
      />

      {followTab && profile && (
        <FollowListModal
          userId={profile.userId}
          nickname={profile.nickname}
          initialTab={followTab}
          onClose={closeFollowList}
        />
      )}

      <div className="mypage page">
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
              {/* 게시글과 임시저장에만 숫자를 붙인다 — 저장/알림 개수는 미리 알 방법이 없다 */}
              {t.key === 'posts' && <span className="mypage__tab-count">{profile?.postCount ?? 0}</span>}
              {t.key === 'drafts' && drafts.length > 0 && (
                <span className="mypage__tab-count">{drafts.length}</span>
              )}
            </button>
          ))}
        </nav>

        {loading && (
          <Loading size={96} />
        )}

        {!loading && error && (
          <div className="state">
            <p className="state__title">불러오지 못했어요.</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="state">
            <p className="state__title">
              {tab === 'posts' && '아직 작성한 글이 없어요.'}
              {tab === 'drafts' && '임시저장한 글이 없어요.'}
              {tab === 'saved' && '저장한 공구가 없어요.'}
              {tab === 'alerts' && '알림 신청한 공구가 없어요.'}
            </p>
            {tab === 'drafts' && (
              <p className="state__help">
                글을 쓰다가 <b>임시저장</b>을 누르면 여기에 담겨요. 이 브라우저에만 저장되고, 등록하기
                전까지는 아무에게도 보이지 않아요.
              </p>
            )}
            {(tab === 'posts' || tab === 'drafts') && (
              <Link className="btn btn--primary" to="/write" style={{ marginTop: 12 }}>
                공구 열기
              </Link>
            )}
          </div>
        )}

        {!loading && !error && tab === 'drafts' && drafts.length > 0 && (
          <ul className="drafts">
            {drafts.map((d) => {
              const thumb = d.form?.imageUrls?.[0]
              return (
                <li key={d.draftId} className="drafts__row">
                  {thumb ? (
                    <img className="drafts__thumb" src={thumb} alt="" />
                  ) : (
                    <ImageFallback size={56} />
                  )}

                  <div className="drafts__body">
                    <Link to={`/write?draft=${d.draftId}`} className="drafts__name">
                      {draftTitle(d)}
                    </Link>
                    <span className="drafts__meta">
                      <span className="drafts__type">
                        {d.form?.postType === 'GENERAL' ? '유저 글' : '셀러 공구'}
                      </span>
                      {d.updatedAt && ` · ${fromNow(d.updatedAt)} 저장`}
                    </span>
                  </div>

                  <div className="drafts__actions">
                    <Link className="btn btn--ghost drafts__resume" to={`/write?draft=${d.draftId}`}>
                      이어서 쓰기
                    </Link>
                    <button
                      type="button"
                      className="drafts__delete"
                      onClick={() => deleteDraft(d.draftId)}
                      aria-label="임시저장 삭제"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {!loading && !error && items.length > 0 && tab !== 'alerts' && tab !== 'drafts' && (
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
                  <ImageFallback size={56} />
                )}

                <div className="alerts__body">
                  <Link to={`/posts/${a.postId}`} className="alerts__name">
                    {a.productName || a.title}
                  </Link>
                  <span className="alerts__period">
                    {formatPeriod(a.startDate, a.endDate)}
                    {a.endDate && ` · ${ddayLabel(a.endDate)}`}
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
    </>
  )
}
