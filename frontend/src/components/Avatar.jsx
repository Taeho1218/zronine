import { initial } from '../lib/format'
import './Avatar.css'

/**
 * 프로필 이미지가 없을 때 시안처럼 닉네임 첫 글자를 색 원 안에 그린다.
 * 색은 userId 로 고정해 같은 사람이 화면마다 다른 색으로 보이지 않게 한다.
 */
const TONES = ['a', 'b', 'c', 'd', 'e']

export default function Avatar({ user, size = 40, className = '' }) {
  const tone = TONES[Math.abs(Number(user?.userId) || 0) % TONES.length]
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }

  if (user?.profileImageUrl) {
    return (
      <img
        className={`avatar ${className}`}
        style={style}
        src={user.profileImageUrl}
        alt={user.nickname ?? '프로필'}
      />
    )
  }

  return (
    <span className={`avatar avatar--${tone} ${className}`} style={style} aria-hidden="true">
      {initial(user?.nickname)}
    </span>
  )
}
