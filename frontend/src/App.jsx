import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Loading from './components/Loading'
import WriteFab from './components/WriteFab'
import ScreenBlocker from './components/ScreenBlocker'
import { useAuth } from './store/AuthContext'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import PostWritePage from './pages/PostWritePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import MyPage from './pages/MyPage'
import UserProfilePage from './pages/UserProfilePage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

/** 로그인이 필요한 화면. 인증 복원이 끝나기 전에 튕기지 않도록 ready 를 기다린다. */
function Protected({ children }) {
  const { isLoggedIn, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <Loading />
    )
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}

/** 로그인/로그아웃이 도는 동안 띄우는 문구. 그 밖에는 덮개를 띄우지 않는다. */
const PENDING_MESSAGE = { login: '로그인 중…', logout: '로그아웃 중…' }

export default function App() {
  const { pending } = useAuth()

  return (
    // 내용이 짧은 화면에서도 푸터가 창 아래에 붙도록 세로 flex 로 감싼다
    <div className="app">
      <Header />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          {/* 다른 사람 프로필은 비로그인도 볼 수 있다 */}
          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/write"
            element={
              <Protected>
                <PostWritePage />
              </Protected>
            }
          />
          <Route
            path="/mypage"
            element={
              <Protected>
                <MyPage />
              </Protected>
            }
          />
          <Route
            path="/settings"
            element={
              <Protected>
                <SettingsPage />
              </Protected>
            }
          />
          {/* 헤더 북마크 아이콘은 마이페이지의 저장 탭으로 보낸다 */}
          <Route path="/saved" element={<Navigate to="/mypage?tab=saved" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      {/* 화면에 고정된 글쓰기 입구. 어느 화면 위에 뜰지는 컴포넌트가 직접 정한다 */}
      <WriteFab />

      {/* 로그인·로그아웃 중에는 화면 전체를 흐리게 덮어 알린다 */}
      {pending && <ScreenBlocker message={PENDING_MESSAGE[pending]} />}
    </div>
  )
}
