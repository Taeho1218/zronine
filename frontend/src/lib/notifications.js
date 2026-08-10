import { userApi } from '../api'
import { ddayLabel, placeholderTone } from './format'

/**
 * 알림 패널에 뿌릴 행 목록을 만든다.
 *
 * 백엔드에는 통합 알림 테이블이 없고 "알림 신청한 셀러글 내역"(GET /api/users/me/alerts)만 있다.
 * 그래서 지금 실제로 만들 수 있는 알림은 내가 신청해둔 공구의 진행 상태 변화뿐이며,
 * 시안의 "댓글 답글 / 좋아요 / 저장" 알림은 서버에 원본 데이터가 생긴 뒤에 여기에 합쳐 붙이면 된다.
 */
const READ_KEY = 'gonggu.readNotifications'

function readIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function writeIds(set) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
  } catch {
    /* 저장 실패 시 이번 세션에서만 읽음 처리된다 */
  }
}

function alertToNotification(alert) {
  const label = ddayLabel(alert.endDate)
  const name = alert.productName || alert.title

  let text
  if (alert.progress === 'UPCOMING') {
    text = `알림 신청한 '${name}' 공구가 곧 열려요.`
  } else if (alert.progress === 'ENDED') {
    text = `'${name}' 공구 모집이 종료되었어요.`
  } else {
    text = `'${name}' 공구 마감이 ${label} 남았어요. 아직 참여 전이라면 서둘러 주세요.`
  }

  return {
    id: `alert-${alert.alertId}`,
    kind: 'gonggu',
    icon: alert.progress === 'ENDED' ? 'check' : 'clock',
    text,
    postId: alert.postId,
    thumbnailUrl: alert.thumbnailUrl,
    tone: placeholderTone(alert.postId),
    buyUrl: alert.buyUrl,
    createdAt: alert.alertedAt,
  }
}

export async function fetchNotifications() {
  const page = await userApi.myAlerts(0)
  const read = readIds()
  return (page?.content ?? [])
    .map(alertToNotification)
    .map((n) => ({ ...n, unread: !read.has(n.id) }))
}

export function markRead(ids) {
  const set = readIds()
  ids.forEach((id) => set.add(id))
  writeIds(set)
}
