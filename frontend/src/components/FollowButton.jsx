import { useNavigate } from 'react-router-dom'
import { followApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import { CheckIcon, PlusIcon } from './icons'

/**
 * 팔로우 토글. 상세 페이지와 프로필 페이지가 같이 쓴다.
 *
 * 서버가 최신 팔로워 수를 함께 돌려주므로(FollowResponse), 그 값을 부모에 넘겨
 * 프로필 화면의 팔로워 숫자도 다시 조회 없이 맞춘다.
 */
export default function FollowButton({ userId, following, onChange, className = '' }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  // useState 로만 막으면 같은 틱에 들어온 연타가 아직 갱신 안 된 값을 읽고 전부 통과한다.
  // useBusy 는 ref 로 동기 차단하므로 요청이 한 번만 나간다.
  const [busy, run] = useBusy()

  function toggle() {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    run(async () => {
      const next = !following
      onChange?.({ following: next }) // 먼저 눌린 것처럼 보여주고
      try {
        const res = next ? await followApi.follow(userId) : await followApi.unfollow(userId)
        onChange?.({ following: res?.following ?? next, followerCount: res?.followerCount })
      } catch (err) {
        onChange?.({ following: !next }) // 실패하면 되돌린다
        window.alert(err.message)
      }
    })
  }

  return (
    <button
      type="button"
      className={`followbtn ${following ? 'is-on' : ''} ${className}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? <CheckIcon width={15} height={15} /> : <PlusIcon width={15} height={15} />}
      {following ? '팔로잉' : '팔로우'}
    </button>
  )
}
