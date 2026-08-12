/** 19900 → "19,900원" */
export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return `${n.toLocaleString('ko-KR')}원`
}

/** "19,900원" / "19900" 처럼 사람이 친 문자열에서 숫자만 남긴다. */
export function parsePrice(text) {
  const digits = String(text ?? '').replace(/[^\d]/g, '')
  return digits === '' ? null : Number(digits)
}

/**
 * 서버가 찍어 보낸 시각(작성 시각·알림 시각)을 실제 순간으로 읽는다.
 *
 * 배포된 백엔드는 UTC 로 돌고 createdAt 은 타임존이 없는 LocalDateTime 이라
 * "2026-08-11T04:40:13" 처럼 UTC 벽시계 값이 그대로 내려온다. 이걸 브라우저가 로컬(KST)로 읽으면
 * 오후 1시 40분에 쓴 글이 오전 4시 40분 글이 되고, 방금 단 댓글이 "9시간 전" 이 된다.
 * 그래서 타임존이 안 붙어 있으면 UTC 로 못박아 해석한다.
 *
 * 모집 기간(startDate/endDate)은 여기 태우면 안 된다. 그건 글쓴이가 고른 날짜를 그대로 담아
 * 보낸 값이라(00:00:00 / 23:59:59) 로컬 시각으로 읽어야 날짜가 맞는다.
 */
export function serverInstant(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const text = String(value).trim().replace(' ', 'T')
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)
  const d = new Date(hasZone ? text : `${text}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function toDate(value) {
  if (!value) return null
  // 서버는 LocalDateTime 을 "2026-08-10T14:00:00" 처럼 타임존 없이 내려준다.
  // 브라우저가 이를 UTC 로 해석하지 않도록 로컬 시각으로 파싱한다.
  const d = new Date(typeof value === 'string' && !value.endsWith('Z') ? value.replace(' ', 'T') : value)
  return Number.isNaN(d.getTime()) ? null : d
}

const pad = (n) => String(n).padStart(2, '0')

/** 2026-08-10 → "2026.08.10" */
export function formatDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

/** "2026.08.10 · 오후 2:14" */
export function formatDateTime(value) {
  const d = toDate(value)
  if (!d) return ''
  const h = d.getHours()
  const meridiem = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${formatDate(d)} · ${meridiem} ${h12}:${pad(d.getMinutes())}`
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** "08.13 (수)" — 마감처럼 무슨 요일인지가 중요한 자리에 쓴다. */
export function formatDateDay(value) {
  const d = toDate(value)
  if (!d) return ''
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${WEEKDAY[d.getDay()]})`
}

/** "08.10 (일) ~ 08.13 (수)" */
export function formatPeriodDay(start, end) {
  const from = formatDateDay(start)
  if (!from) return ''
  return `${from} ~ ${formatDateDay(end) || '미정'}`
}

/**
 * 모집 기간 "08.10 ~ 08.17".
 * 수집 단계에서 마감일을 못 채운 공구가 있어, 끝이 비면 "미정"으로 적어 빈칸으로 보이지 않게 한다.
 */
export function formatPeriod(start, end) {
  const s = toDate(start)
  const e = toDate(end)
  if (!s) return ''
  const from = `${pad(s.getMonth() + 1)}.${pad(s.getDate())}`
  if (!e) return `${from} ~ 미정`
  return `${from} ~ ${pad(e.getMonth() + 1)}.${pad(e.getDate())}`
}

/**
 * 마감까지 남은 일수. 시안의 "D-7" 표기용.
 * 오늘 자정 기준으로 잘라야 "23시간 남았는데 D-0" 같은 어색한 값이 안 나온다.
 */
export function dday(end) {
  const e = toDate(end)
  if (!e) return null
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(e.getFullYear(), e.getMonth(), e.getDate())
  return Math.round((b - a) / 86400000)
}

export function ddayLabel(end) {
  const n = dday(end)
  if (n === null) return ''
  if (n === 0) return 'D-DAY'
  return n > 0 ? `D-${n}` : `종료`
}

/** "5분 전" / "3시간 전" / "어제" / "2일 전" */
export function fromNow(value) {
  const d = toDate(value)
  if (!d) return ''
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  const days = Math.floor(diff / 86400)
  if (days === 1) return '어제'
  if (days < 30) return `${days}일 전`
  return formatDate(d)
}

export const PROGRESS_LABEL = {
  UPCOMING: '진행 예정',
  ONGOING: '진행중',
  ENDED: '종료',
  NONE: '',
}

/** 닉네임 첫 글자를 아바타에 쓴다. */
export function initial(nickname) {
  return (nickname ?? '?').trim().charAt(0) || '?'
}
