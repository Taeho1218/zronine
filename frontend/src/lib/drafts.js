/**
 * 임시저장 보관함.
 *
 * 서버에는 임시저장 개념이 없다 — 글은 등록하는 순간 공개된다. 그래서 쓰다 만 글은
 * 브라우저 localStorage 에만 담아두고, 마이페이지의 "임시저장" 탭이 이 보관함을 그대로 보여준다.
 * 기기나 브라우저를 옮기면 따라오지 않고, 방문 기록을 지우면 함께 사라진다.
 */

const KEY = 'gonggu.drafts.v1'
/** 임시저장이 한 칸뿐이던 시절의 키. 남아 있으면 처음 읽을 때 새 보관함으로 옮긴다. */
const LEGACY_KEY = 'gonggu.draft'
/** 브라우저 저장 공간(보통 5MB)을 임시저장이 다 먹지 않도록 오래된 것부터 버린다. */
const MAX_DRAFTS = 30

function readAll() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((d) => d && typeof d === 'object' && d.draftId) : []
  } catch {
    // 손상된 값은 되살릴 방법이 없다. 빈 보관함으로 보고 넘어간다.
    return []
  }
}

/**
 * 저장 공간이 꽉 차면 가장 오래된 임시저장부터 버리고 다시 시도한다.
 * 마지막 하나까지 못 넣으면 그때는 부르는 쪽이 알아야 하므로 예외를 그대로 올린다.
 */
function writeAll(list) {
  let next = list.slice(0, MAX_DRAFTS)
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      return
    } catch (err) {
      if (next.length <= 1) throw err
      next = next.slice(0, -1)
    }
  }
}

const ownerOf = (userId) => (userId == null ? null : String(userId))

const newId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

/** 제목·내용·사진·물건 정보가 모두 비어 있으면 저장할 것이 없다고 본다. */
export function isBlankDraft(form) {
  if (!form) return true
  const hasText = [form.title, form.content, form.productName, form.buyUrl, form.eventNote].some(
    (v) => String(v ?? '').trim() !== '',
  )
  return !hasText && (form.imageUrls?.length ?? 0) === 0 && String(form.price ?? '') === ''
}

/** 예전 단일 슬롯에 남아 있던 글을 새 보관함의 항목 하나로 옮긴다. */
function migrateLegacy(userId) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const form = JSON.parse(raw)
    if (!isBlankDraft(form)) {
      writeAll([
        { draftId: newId(), ownerId: ownerOf(userId), updatedAt: new Date().toISOString(), form },
        ...readAll(),
      ])
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // 옮기지 못했으면 예전 값은 그대로 둔다. 다음에 다시 시도된다.
  }
}

/** 최근에 저장한 것부터. */
export function listDrafts(userId) {
  migrateLegacy(userId)
  const owner = ownerOf(userId)
  return readAll()
    .filter((d) => d.ownerId == null || d.ownerId === owner)
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
}

export function getDraft(draftId) {
  if (!draftId) return null
  return readAll().find((d) => d.draftId === draftId) ?? null
}

/**
 * draftId 를 주면 그 자리를 덮어쓰고, 없으면 새 칸을 만든다.
 * 저장에 실패하면(저장 공간 부족 등) 예외가 나므로 부르는 쪽에서 알려줘야 한다.
 */
export function saveDraft(form, { draftId, userId } = {}) {
  const list = readAll()
  const id = draftId && list.some((d) => d.draftId === draftId) ? draftId : newId()
  const draft = { draftId: id, ownerId: ownerOf(userId), updatedAt: new Date().toISOString(), form }
  // 방금 저장한 것이 목록 맨 위에 오도록 기존 항목은 빼고 앞에 다시 붙인다.
  writeAll([draft, ...list.filter((d) => d.draftId !== id)])
  return draft
}

export function removeDraft(draftId) {
  if (!draftId) return
  const list = readAll()
  const next = list.filter((d) => d.draftId !== draftId)
  if (next.length !== list.length) writeAll(next)
}

/** 목록에 적을 이름. 제목을 안 적고 저장한 글도 뭐였는지 알아볼 수 있게 내용 첫 줄까지 본다. */
export function draftTitle(draft) {
  const form = draft?.form ?? {}
  const title = String(form.title ?? '').trim()
  if (title) return title
  const firstLine = String(form.content ?? '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  if (firstLine) return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine
  return '제목 없는 글'
}
