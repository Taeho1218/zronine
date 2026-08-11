import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApi, userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import { BellIcon } from '../components/icons'

/**
 * 프로필의 "알림 받기".
 *
 * 서버에는 "이 셀러를 구독한다"는 API 가 없고 알림은 공구 글 단위(POST /api/posts/{id}/alert)로만 건다.
 * 그래서 이 버튼은 그 사람이 지금 열어둔(마감 안 된) 셀러 공구 전부에 한 번에 알림을 걸고,
 * 다시 누르면 전부 해제한다. 걸 공구가 하나도 없으면 버튼 자체를 그리지 않는다.
 *
 * 켜짐/꺼짐은 내 알림 목록(GET /api/users/me/alerts)과 대조해 정한다.
 */
export default function ProfileAlertButton({ posts }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [on, setOn] = useState(false)
  const [busy, run] = useBusy()

  // 마감된 공구에는 알림을 걸 수 없고, 일반글에는 애초에 알림 기능이 없다.
  const targets = posts.filter((p) => p.postType === 'SELLER' && p.progress !== 'ENDED')
  const ids = targets.map((p) => p.postId)
  const key = ids.join(',')

  useEffect(() => {
    if (!isLoggedIn || ids.length === 0) {
      setOn(false)
      return undefined
    }
    let alive = true
    userApi
      .myAlerts(0)
      .then((page) => {
        if (!alive) return
        const mine = new Set((page?.content ?? []).map((a) => a.postId))
        setOn(ids.every((id) => mine.has(id)))
      })
      .catch(() => alive && setOn(false))
    return () => {
      alive = false
    }
    // ids 는 매 렌더 새 배열이라 그대로 두면 계속 다시 부른다. 내용이 바뀔 때만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isLoggedIn])

  if (ids.length === 0) return null

  function toggle() {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    run(async () => {
      const next = !on
      const call = next ? postApi.alert : postApi.unalert
      // 이미 걸려 있던 글은 서버가 중복이라고 막는다. 결과가 어떻든 "원하는 상태"는 같으므로 넘어간다.
      await Promise.allSettled(ids.map((id) => call(id)))
      setOn(next)
    })
  }

  return (
    <button
      type="button"
      className={`phead__alert ${on ? 'is-on' : ''}`}
      onClick={toggle}
      disabled={busy}
      title={`진행 중인 공구 ${ids.length}건의 알림을 ${on ? '해제' : '신청'}합니다`}
    >
      <BellIcon width={15} height={15} />
      {busy ? '처리 중…' : on ? '알림 받는 중' : '알림 받기'}
    </button>
  )
}
