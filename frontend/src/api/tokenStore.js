/**
 * 액세스/리프레시 토큰 보관소.
 *
 * client.js 와 AuthContext 양쪽에서 토큰을 건드리는데,
 * 둘이 각자 localStorage 를 읽고 쓰면 "로그아웃했는데 다음 요청에 옛 토큰이 붙는" 식으로 어긋난다.
 * 그래서 읽기/쓰기 창구를 이 모듈 하나로 모으고, 변경 시 구독자에게 알린다.
 */
const ACCESS_KEY = 'gonggu.accessToken'
const REFRESH_KEY = 'gonggu.refreshToken'
const USER_KEY = 'gonggu.user'

const listeners = new Set()

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    // 사파리 프라이빗 모드 등에서 localStorage 접근이 막히면 메모리 없이 동작한다.
    return null
  }
}

function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 저장 실패는 무시하고 세션 동안만 동작하게 둔다 */
  }
}

export const tokenStore = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),

  getUser() {
    const raw = read(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  /** 로그인/재발급 성공 시 호출. user 를 넘기지 않으면 기존 사용자 정보를 유지한다. */
  set({ accessToken, refreshToken, user }) {
    write(ACCESS_KEY, accessToken ?? null)
    write(REFRESH_KEY, refreshToken ?? null)
    if (user !== undefined) write(USER_KEY, user ? JSON.stringify(user) : null)
    listeners.forEach((fn) => fn())
  },

  clear() {
    write(ACCESS_KEY, null)
    write(REFRESH_KEY, null)
    write(USER_KEY, null)
    listeners.forEach((fn) => fn())
  },

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
