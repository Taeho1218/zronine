import { useEffect } from 'react'
import mascotUrl from '../assets/brand/gonggu-mascot-animated.svg'
import './ScreenBlocker.css'

/**
 * 화면 전체를 흐리게 덮는 진행 표시.
 *
 * 로그인·로그아웃처럼 끝나고 나면 화면이 통째로 바뀌는 일에만 쓴다. 뒤를 흐리게 덮는 이유는
 * 두 가지다 — 처리가 끝나기 전에 다시 누르거나 다른 곳으로 넘어가지 못하게 막고,
 * 지금 보고 있는 화면이 곧 바뀔 상태라는 걸 눈으로 알 수 있게 한다.
 */
export default function ScreenBlocker({ message }) {
  useEffect(() => {
    // 덮여 있는 동안 뒤 화면이 따라 스크롤되지 않게 막는다
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="blocker" role="status" aria-live="polite" aria-busy="true">
      <div className="blocker__box">
        <img className="blocker__mascot" src={mascotUrl} alt="" />
        <p className="blocker__text">{message}</p>
      </div>
    </div>
  )
}
