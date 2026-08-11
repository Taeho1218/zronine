import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { userApi } from '../api'
import FollowButton from '../components/FollowButton'
import FollowListModal from '../components/FollowListModal'
import Loading from '../components/Loading'
import ProfileAlertButton from '../components/ProfileAlertButton'
import ProfileHeader from '../components/ProfileHeader'
import PostCard from '../components/PostCard'
import { GridIcon, ListIcon } from '../components/icons'
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
  const [sort, setSort] = useState('latest') // 'latest' | 'popular'
  const [view, setView] = useState('grid') // 'grid' | 'list'

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

  /*
   * 서버는 이 목록을 최신순(id 내림차순)으로만 내려준다.
   * "인기순"은 받아온 목록 안에서 다시 세우는 것이라, 글이 한 페이지를 넘으면
   * 그 페이지 안에서의 인기순이다. (서버에 정렬 파라미터가 생기면 그때 넘기면 된다)
   */
  const shown = useMemo(() => {
    if (sort !== 'popular') return posts
    return [...posts].sort(
      (a, b) => b.likeCount - a.likeCount || b.commentCount - a.commentCount || b.postId - a.postId,
    )
  }, [posts, sort])

  if (loading) {
    return (
      <Loading />
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
            <>
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
              <ProfileAlertButton posts={posts} />
            </>
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
        <div className="plist__head">
          <div>
            <h2 className="plist__title">
              게시글 <span className="plist__count">{profile.postCount ?? posts.length}</span>
            </h2>
            <p className="plist__sub">{profile.nickname}님이 작성한 공구와 이야기를 모아봤어요</p>
          </div>

          <div className="plist__tools">
            <button
              type="button"
              className={`plist__sort ${sort === 'latest' ? 'is-on' : ''}`}
              onClick={() => setSort('latest')}
            >
              최신순
            </button>
            <button
              type="button"
              className={`plist__sort ${sort === 'popular' ? 'is-on' : ''}`}
              onClick={() => setSort('popular')}
            >
              인기순
            </button>

            <button
              type="button"
              className="plist__view"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              aria-label={view === 'grid' ? '목록으로 보기' : '격자로 보기'}
              title={view === 'grid' ? '목록으로 보기' : '격자로 보기'}
            >
              {view === 'grid' ? <GridIcon width={19} height={19} /> : <ListIcon width={19} height={19} />}
            </button>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="state">
            <p className="state__title">아직 올린 글이 없어요.</p>
          </div>
        ) : (
          <div className={`mypage__grid ${view === 'list' ? 'mypage__grid--list' : ''}`}>
            {shown.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
