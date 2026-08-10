import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, userApi } from '../api'
import { tokenStore } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser())
  const [ready, setReady] = useState(false)

  // 토큰 저장소가 바뀌면(재발급, 다른 탭 로그아웃) 화면 상태도 따라간다.
  useEffect(() => tokenStore.subscribe(() => setUser(tokenStore.getUser())), [])

  // 새로고침 직후엔 localStorage 의 user 만 있고 서버 기준 최신 정보가 없다.
  // 토큰이 살아 있는지 겸사겸사 확인할 겸 프로필을 한 번 다시 읽는다.
  useEffect(() => {
    let alive = true
    async function bootstrap() {
      if (!tokenStore.getAccessToken()) {
        setReady(true)
        return
      }
      try {
        const profile = await userApi.me()
        if (!alive) return
        tokenStore.set({
          accessToken: tokenStore.getAccessToken(),
          refreshToken: tokenStore.getRefreshToken(),
          user: { userId: profile.userId, nickname: profile.nickname, profileImageUrl: profile.profileImageUrl },
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
    const token = await authApi.login(email, password)
    tokenStore.set({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      user: token.user,
    })
    return token.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 서버가 토큰을 들고 있지 않으므로 로그아웃 호출 실패는 무시하고 로컬만 비운다.
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
