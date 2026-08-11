/**
 * 프로필 커버 사진을 브라우저에 남겨두는 임시 보관소.
 *
 * 서버 UserProfileResponse 에는 아직 coverImageUrl 이 없어서, 저장해도 다시 받아올 곳이 없다.
 * 그래서 내가 고른 커버만 여기에 적어두고 내 프로필에서 되살린다.
 * 서버가 coverImageUrl 을 내려주기 시작하면 그 값이 항상 우선하므로 이 파일은 자연히 안 쓰이게 된다.
 *
 * 한 브라우저 안에서도 계정이 바뀔 수 있어 userId 별로 나눠 담는다.
 */
const KEY = 'gonggu.cover'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getLocalCover(userId) {
  if (userId == null) return null
  return readAll()[String(userId)] ?? null
}

export function setLocalCover(userId, url) {
  if (userId == null) return
  const all = readAll()
  if (url) all[String(userId)] = url
  else delete all[String(userId)]

  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 저장 용량을 넘겼을 때. 이번 세션 화면에는 이미 반영돼 있으니 조용히 넘어간다.
  }
}
