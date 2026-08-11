import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import { ArrowRightIcon } from '../components/icons'
import logoUrl from '../assets/brand/gg_tagline.png'
import './AuthPages.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, run] = useBusy()

  function submit(e) {
    e.preventDefault()
    run(async () => {
      setError(null)
      try {
        await login(email.trim(), password)
        // 보호된 페이지에서 넘어온 경우 원래 가려던 곳으로 되돌려준다.
        navigate(location.state?.from ?? '/', { replace: true })
      } catch (err) {
        setError(err.message)
      }
    })
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <img className="auth__logo" src={logoUrl} alt="ㄱㄱ 함께 사요" />
          <h1 className="auth__title">로그인</h1>
        </div>

        <form className="auth__form" onSubmit={submit}>
          {error && <p className="auth__error">{error}</p>}

          <label className="field">
            <span className="field__label">아이디</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block btn--lg auth__submit" disabled={busy}>
            {busy ? '확인 중…' : '확인'}
          </button>
        </form>

        <div className="auth__links">
          {/* 아이디/비밀번호 찾기는 아직 서버 API 가 없어 자리만 잡아둔다. */}
          <span>아이디 찾기</span>
          <span className="auth__links-sep">·</span>
          <span>비밀번호 찾기</span>
        </div>

        <div className="auth__divider" />

        <p className="auth__switch">
          아직 회원이 아니신가요?
          <Link to="/signup">
            이메일로 회원가입 <ArrowRightIcon width={15} height={15} />
          </Link>
        </p>
      </div>
    </div>
  )
}
