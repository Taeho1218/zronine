import Avatar from './Avatar'
import { ExternalLinkIcon } from './icons'
import './ProfileHeader.css'

/**
 * 마이페이지 / 상대 프로필이 함께 쓰는 커버형 헤더.
 *
 * 넓은 배경 위에 게시물 수 → 프로필(사진·이름·팔로워/팔로잉) 순으로 쌓는다.
 * 두 화면이 같은 모양을 유지하도록 markup 을 한곳에 모았고,
 * 화면마다 다른 것(팔로우 버튼 등)은 besideName 으로 받아 이름 옆에 놓는다.
 */
export default function ProfileHeader({
  profile,
  onOpenFollowers,
  onOpenFollowings,
  topRight,
  besideName,
}) {
  if (!profile) return null

  return (
    <header className="phead">
      {topRight && <div className="phead__corner">{topRight}</div>}

      <div className="phead__inner">
        <p className="phead__stats">
          <span className="phead__stat">
            게시물 <strong>{profile.postCount ?? 0}</strong>
          </span>
        </p>

        <div className="phead__identity">
          <Avatar user={profile} size={56} className="phead__avatar" />

          <div className="phead__who">
            <span className="phead__name">{profile.nickname}</span>

            {/* 이름 바로 아래에서 팔로워/팔로잉을 보여주고, 눌러서 목록도 열 수 있다 */}
            <span className="phead__follow">
              <button type="button" className="phead__follow-btn" onClick={onOpenFollowers}>
                팔로워 <strong>{profile.followerCount ?? 0}</strong>
              </button>
              <span className="phead__dot" aria-hidden="true" />
              <button type="button" className="phead__follow-btn" onClick={onOpenFollowings}>
                팔로잉 <strong>{profile.followingCount ?? 0}</strong>
              </button>
            </span>

            {profile.email && <span className="phead__meta">{profile.email}</span>}
          </div>

          {/* 팔로우 버튼처럼 이름 옆에 붙는 것 */}
          {besideName && <div className="phead__beside">{besideName}</div>}

          {profile.instagramUrl && (
            <a
              className="phead__insta"
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="인스타그램 열기"
            >
              인스타그램 <ExternalLinkIcon width={13} height={13} />
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
