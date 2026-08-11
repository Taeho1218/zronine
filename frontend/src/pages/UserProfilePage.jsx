import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { userApi } from '../api'
import FollowButton from '../components/FollowButton'
import FollowListModal from '../components/FollowListModal'
import ProfileHeader from '../components/ProfileHeader'
import PostCard from '../components/PostCard'
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
    /* 커버가 화면 끝까지 깔려야 해서 헤더만 .page 바깥에 둔다 */
    <>
      {/* 커버를 따로 올린 적 없는 사람은 자기가 올린 첫 공구 사진으로 커버를 채운다 */}
      <ProfileHeader
        profile={profile}
        onOpenFollowers={() => setFollowTab('followers')}
        onOpenFollowings={() => setFollowTab('followings')}
        fallbackCover={posts.find((p) => p.thumbnailUrl)?.thumbnailUrl ?? null}
        besideName={
          profile.me ? (
            <Link to="/mypage" className="phead__mine">
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
          )
        }
      />

      {followTab && (
        <FollowListModal
          userId={profile.userId}
          nickname={profile.nickname}
          initialTab={followTab}
          onClose={closeFollowList}
        />
      )}

      <div className="mypage page">
        {/* 마이페이지의 탭 줄과 같은 자리·같은 모양이라 남의 프로필도 눈이 헷갈리지 않는다 */}
        <nav className="mypage__tabs">
          <span className="mypage__tab is-active">
            게시글
            <span className="mypage__tab-count">{profile.postCount ?? posts.length}</span>
          </span>
        </nav>

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
    </>
  )
}
