/**
 * 액세스 토큰과 로그인 사용자 정보 보관소.
 *
 * 리프레시 토큰은 여기서 다루지 않는다. 백엔드가 httpOnly 쿠키로만 내려주므로
 * 자바스크립트에서는 읽지도 쓰지도 못하고, 브라우저가 /api/auth 요청에 알아서 실어 보낸다.
 * 우리가 할 일은 재발급을 "호출"하는 것뿐이다. (client.js 의 reissue 참고)
 *
 * client.js 와 AuthContext 양쪽에서 토큰을 건드리는데 둘이 각자 localStorage 를 읽고 쓰면
 * "로그아웃했는데 다음 요청에 옛 토큰이 붙는" 식으로 어긋나므로 창구를 이 모듈 하나로 모은다.
 */
const ACCESS_KEY = 'gonggu.accessToken'
const USER_KEY = 'gonggu.user'

const listeners = new Set()

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    // 사파리 프라이빗 모드 등에서 localStorage 접근이 막히면 저장 없이 동작한다.
    return null
  }
}

function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 저장 실패는 무시하고 이번 세션 동안만 동작하게 둔다 */
  }
}

export const tokenStore = {
  getAccessToken: () => read(ACCESS_KEY),

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
  set({ accessToken, user }) {
    write(ACCESS_KEY, accessToken ?? null)
    if (user !== undefined) write(USER_KEY, user ? JSON.stringify(user) : null)
    listeners.forEach((fn) => fn())
  },

  clear() {
    write(ACCESS_KEY, null)
    write(USER_KEY, null)
    listeners.forEach((fn) => fn())
  },

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
