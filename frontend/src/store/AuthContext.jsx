import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, userApi } from '../api'
import { tokenStore } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser())
  const [ready, setReady] = useState(false)
  /*
   * 로그인/로그아웃이 도는 동안 화면 전체를 덮어 알리기 위한 값. null | 'login' | 'logout'.
   * 화면마다 따로 두지 않고 여기서 관리하는 이유: 로그아웃 입구가 헤더 메뉴·환경설정 두 군데라
   * 어느 쪽으로 눌러도 같게 보여야 하고, 처리 중에는 어차피 앱 전체가 잠겨야 하기 때문이다.
   */
  const [pending, setPending] = useState(null)

  // 토큰 저장소가 바뀌면(재발급, 다른 탭 로그아웃) 화면 상태도 따라간다.
  useEffect(() => tokenStore.subscribe(() => setUser(tokenStore.getUser())), [])

  /**
   * 앱을 처음 띄울 때 로그인 상태를 복원한다.
   *
   * 액세스 토큰이 남아 있으면 그것으로 프로필을 다시 읽어 최신 정보로 맞추고,
   * 없으면 리프레시 쿠키만으로 한 번 재발급을 시도한다. 쿠키는 액세스 토큰보다 훨씬 오래 살아서
   * (기본 14일) 브라우저를 껐다 켠 뒤에도 다시 로그인하지 않고 이어서 쓸 수 있다.
   * 쿠키까지 없으면 그냥 비로그인 상태이므로 조용히 넘어간다.
   */
  useEffect(() => {
    let alive = true
    async function bootstrap() {
      try {
        if (!tokenStore.getAccessToken()) {
          const restored = await authApi.reissue()
          if (!restored) {
            tokenStore.clear()
            return
          }
        }
        const profile = await userApi.me()
        if (!alive) return
        tokenStore.set({
          accessToken: tokenStore.getAccessToken(),
          user: {
            userId: profile.userId,
            nickname: profile.nickname,
            profileImageUrl: profile.profileImageUrl,
          },
        })
      } catch {
        if (alive) tokenStore.clear()
      } finally {
        if (alive) setReady(true)
      }
    }
    bootstrap()
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setPending('login')
    try {
      // 응답 바디에는 액세스 토큰만 온다. 리프레시 토큰은 Set-Cookie 로 브라우저가 직접 받는다.
      const token = await authApi.login(email, password)
      tokenStore.set({ accessToken: token.accessToken, user: token.user })
      return token.user
    } finally {
      /*
       * 성공했을 때도 여기서 내린다. 부르는 쪽의 navigate 와 같은 처리 묶음에서 일어나므로
       * 화면은 한 번에 바뀌고, 덮개가 걷힌 옛 화면이 잠깐 보이는 일은 없다.
       */
      setPending(null)
    }
  }, [])

  /**
   * 프로필을 고쳤을 때 화면에 남아 있는 내 정보(헤더 아바타·닉네임)를 함께 갱신한다.
   * 이걸 안 하면 닉네임을 바꿔도 다시 로그인하기 전까지 옛 이름이 그대로 보인다.
   */
  const updateUser = useCallback((patch) => {
    const current = tokenStore.getUser()
    if (!current) return
    tokenStore.set({ accessToken: tokenStore.getAccessToken(), user: { ...current, ...patch } })
  }, [])

  const logout = useCallback(async () => {
    setPending('logout')
    try {
      // 리프레시 쿠키는 httpOnly 라 자바스크립트로 못 지운다.
      // 서버가 만료된 쿠키를 내려줘야 브라우저가 폐기하므로 이 호출은 건너뛰면 안 된다.
      await authApi.logout()
    } catch {
      // 네트워크가 끊겨 실패해도 최소한 로컬 상태는 비워 로그아웃된 것처럼 동작하게 한다.
    } finally {
      tokenStore.clear()
      setPending(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoggedIn: !!user, ready, pending, login, logout, updateUser }),
    [user, ready, pending, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
