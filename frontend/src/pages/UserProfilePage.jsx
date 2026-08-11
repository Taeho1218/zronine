import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { userApi } from '../api'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import FollowListModal from '../components/FollowListModal'
import PostCard from '../components/PostCard'
import { ExternalLinkIcon } from '../components/icons'
import { formatDate } from '../lib/format'
import './MyPage.css'

/**
 * 다른 사람 프로필. 비로그인 사용자도 볼 수 있다(서버에서 GET /api/users/* 는 permitAll).
 * 본인 프로필이면(me=true) 팔로우 버튼을 감추고 마이페이지로 갈 수 있게 안내한다.
 */
export default function UserProfilePage() {
  const { userId } = useParams()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // null 이면 닫힌 상태, 'followers' | 'followings' 면 그 탭으로 열린다.
  const [followTab, setFollowTab] = useState(null)

  /** 목록 창에서 팔로우를 눌렀으면 프로필의 숫자도 다시 읽어 맞춘다. */
  function closeFollowList(changed) {
    setFollowTab(null)
    if (changed) userApi.profile(userId).then(setProfile).catch(() => {})
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setProfile(null)

    Promise.all([userApi.profile(userId), userApi.userPosts(userId, 0)])
      .then(([p, page]) => {
        if (!alive) return
        setProfile(p)
        setPosts(page?.content ?? [])
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="state">
        <span className="spinner" />
        <span>불러오는 중…</span>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="state">
        <p className="state__title">프로필을 불러오지 못했어요.</p>
        <p>{error ?? '존재하지 않는 회원입니다.'}</p>
        <Link className="btn btn--ghost" to="/" style={{ marginTop: 12 }}>
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className="mypage page">
      <header className="mypage__head">
        <Avatar user={profile} size={72} />

        <div className="mypage__info">
          <h1 className="mypage__name">{profile.nickname}</h1>
          {/* 서버가 UserProfileResponse 에 담아주는 값. 등록해둔 사람만 링크가 보인다. */}
          {profile.instagramUrl && (
            <a
              className="mypage__insta"
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              인스타그램 <ExternalLinkIcon width={13} height={13} />
            </a>
          )}
          {profile.joinedAt && <p className="mypage__joined">{formatDate(profile.joinedAt)} 가입</p>}
        </div>

        <dl className="mypage__stats">
          <div>
            <dt>게시물</dt>
            <dd>{profile.postCount ?? 0}</dd>
          </div>
          {/* 팔로워/팔로잉은 눌러서 목록을 볼 수 있다 */}
          <button type="button" className="mypage__stat-btn" onClick={() => setFollowTab('followers')}>
            <dt>팔로워</dt>
            <dd>{profile.followerCount ?? 0}</dd>
          </button>
          <button type="button" className="mypage__stat-btn" onClick={() => setFollowTab('followings')}>
            <dt>팔로잉</dt>
            <dd>{profile.followingCount ?? 0}</dd>
          </button>
        </dl>

        {profile.me ? (
          <Link to="/mypage" className="btn btn--ghost mypage__logout">
            내 프로필 관리
          </Link>
        ) : (
          <FollowButton
            userId={profile.userId}
            following={profile.following}
            onChange={({ following, followerCount }) =>
              setProfile((prev) => ({
                ...prev,
                following,
                followerCount: followerCount ?? prev.followerCount,
              }))
            }
          />
        )}
      </header>

      {followTab && (
        <FollowListModal
          userId={profile.userId}
          nickname={profile.nickname}
          initialTab={followTab}
          onClose={closeFollowList}
        />
      )}

      <h2 className="mypage__section">게시물 {profile.postCount ?? posts.length}</h2>

      {posts.length === 0 ? (
        <div className="state">
          <p className="state__title">아직 올린 글이 없어요.</p>
        </div>
      ) : (
        <div className="mypage__grid">
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
