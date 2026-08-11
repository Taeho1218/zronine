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
 * 커버 사진은 이 순서로 고른다.
 *   1. 서버가 준 coverImageUrl
 *   2. (내 프로필일 때) 환경설정에서 내가 고른 사진
 *   3. 그 사람이 올린 글의 첫 사진 — 남의 프로필도 초록 단색으로 비어 보이지 않게 한다
 *   4. assets/cover 에 넣어둔 공통 기본 사진
 *   5. 브랜드 색 그라데이션
 *
 * 3번은 커버로 찍은 사진이 아니라 상품 사진이라 크게 확대되면 어색하다.
 * 그래서 이 경우에만 배경을 흐리게 깔아(ambient) 인물/글씨가 앞에 서도록 한다.
 */
export default function ProfileHeader({
  profile,
  onOpenFollowers,
  onOpenFollowings,
  topRight,
  besideName,
  fallbackCover,
}) {
  if (!profile) return null

  // 내가 고른 커버는 내 프로필에서만 되살린다 (남의 프로필에 내 사진이 깔리면 안 된다).
  const chosen = profile.coverImageUrl ?? (profile.me ? getLocalCover(profile.userId) : null)
  const cover = chosen ?? fallbackCover ?? coverImage
  const ambient = !chosen && !!fallbackCover

  return (
    <header className={`phead ${cover ? 'phead--photo' : ''}`}>
      {cover && (
        <span
          className={`phead__bg ${ambient ? 'phead__bg--ambient' : ''}`}
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden="true"
        />
      )}

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
