import Avatar from './Avatar'
import { ExternalLinkIcon } from './icons'
import { coverImage } from '../api/coverImage'
import { getLocalCover } from '../lib/localCover'
import './ProfileHeader.css'

/**
 * 마이페이지 / 상대 프로필이 함께 쓰는 커버형 헤더.
 *
 * 화면 끝까지 깔리는 커버 위에 왼쪽 아래로 사진 → 이름 → 숫자를 얹는다.
 * 두 화면이 같은 모양을 유지하도록 markup 을 한곳에 모았고,
 * 화면마다 다른 것(환경설정·팔로우 버튼)은 topRight / besideName 으로 받는다.
 *
 * 커버 사진은 서버가 coverImageUrl 을 주면 그걸 쓰고, 없으면 환경설정에서 내가 고른 사진을,
 * 그것도 없으면 assets/cover 의 기본 사진을, 마지막으로 브랜드 색 그라데이션을 깐다.
 */
export default function ProfileHeader({
  profile,
  onOpenFollowers,
  onOpenFollowings,
  topRight,
  besideName,
}) {
  if (!profile) return null

  // 내가 고른 커버는 내 프로필에서만 되살린다 (남의 프로필에 내 사진이 깔리면 안 된다).
  const cover = profile.coverImageUrl ?? (profile.me ? getLocalCover(profile.userId) : null) ?? coverImage

  return (
    <header
      className={`phead ${cover ? 'phead--photo' : ''}`}
      style={cover ? { backgroundImage: `url(${cover})` } : undefined}
    >
      <div className="phead__inner">
        {topRight && <div className="phead__corner">{topRight}</div>}

        <div className="phead__identity">
          <Avatar user={profile} size={76} className="phead__avatar" />

          <div className="phead__who">
            <h1 className="phead__name">{profile.nickname}</h1>

            {/* 팔로워·팔로잉은 눌러서 목록을 열 수 있고, 게시글 수는 표시만 한다 */}
            <p className="phead__stats">
              <button type="button" className="phead__stat phead__stat--btn" onClick={onOpenFollowers}>
                팔로워 <strong>{profile.followerCount ?? 0}</strong>
              </button>
              <span className="phead__dot" aria-hidden="true" />
              <button type="button" className="phead__stat phead__stat--btn" onClick={onOpenFollowings}>
                팔로잉 <strong>{profile.followingCount ?? 0}</strong>
              </button>
              <span className="phead__dot" aria-hidden="true" />
              <span className="phead__stat">
                게시글 <strong>{profile.postCount ?? 0}</strong>
              </span>
            </p>
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
