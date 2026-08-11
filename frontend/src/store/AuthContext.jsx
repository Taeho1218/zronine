import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, userApi } from '../api'
import { tokenStore } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser())
  const [ready, setReady] = useState(false)

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
    // 응답 바디에는 액세스 토큰만 온다. 리프레시 토큰은 Set-Cookie 로 브라우저가 직접 받는다.
    const token = await authApi.login(email, password)
    tokenStore.set({ accessToken: token.accessToken, user: token.user })
    return token.user
  }, [])

  const logout = useCallback(async () => {
    try {
      // 리프레시 쿠키는 httpOnly 라 자바스크립트로 못 지운다.
      // 서버가 만료된 쿠키를 내려줘야 브라우저가 폐기하므로 이 호출은 건너뛰면 안 된다.
      await authApi.logout()
    } catch {
      // 네트워크가 끊겨 실패해도 최소한 로컬 상태는 비워 로그아웃된 것처럼 동작하게 한다.
    }
    tokenStore.clear()
  }, [])

  const value = useMemo(
    () => ({ user, isLoggedIn: !!user, ready, login, logout }),
    [user, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
