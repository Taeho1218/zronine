import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { ArrowRightIcon, CheckIcon } from '../components/icons'
import logoUrl from '../assets/gg_tagline.png'
import './AuthPages.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TERMS = [
  { key: 'service', required: true, label: '이용약관 동의' },
  { key: 'privacy', required: true, label: '개인정보 수집·이용 동의' },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
]

/** 입력이 멈춘 뒤에만 중복확인을 호출하도록 값을 지연시킨다. */
function useDebounced(value, ms = 450) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [agreed, setAgreed] = useState({ service: false, privacy: false, marketing: false })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [emailState, setEmailState] = useState(null) // null | 'ok' | 'taken' | 'checking'
  const [nickState, setNickState] = useState(null)

  const debouncedEmail = useDebounced(email)
  const debouncedNickname = useDebounced(nickname)

  useEffect(() => {
    const value = debouncedEmail.trim()
    if (!EMAIL_RE.test(value)) {
      setEmailState(null)
      return undefined
    }
    let alive = true
    setEmailState('checking')
    userApi
      .checkEmail(value)
      .then((res) => alive && setEmailState(res?.available ? 'ok' : 'taken'))
      .catch(() => alive && setEmailState(null))
    return () => {
      alive = false
    }
  }, [debouncedEmail])

  useEffect(() => {
    const value = debouncedNickname.trim()
    if (value.length < 2) {
      setNickState(null)
      return undefined
    }
    let alive = true
    setNickState('checking')
    userApi
      .checkNickname(value)
      .then((res) => alive && setNickState(res?.available ? 'ok' : 'taken'))
      .catch(() => alive && setNickState(null))
    return () => {
      alive = false
    }
  }, [debouncedNickname])

  const allAgreed = TERMS.every((t) => agreed[t.key])
  const requiredAgreed = TERMS.filter((t) => t.required).every((t) => agreed[t.key])
  const passwordMatched = password.length > 0 && password === passwordConfirm

  const canSubmit = useMemo(
    () =>
      EMAIL_RE.test(email.trim()) &&
      emailState !== 'taken' &&
      password.length >= 8 &&
      passwordMatched &&
      nickname.trim().length >= 2 &&
      nickState !== 'taken' &&
      requiredAgreed &&
      !busy,
    [email, emailState, password, passwordMatched, nickname, nickState, requiredAgreed, busy],
  )

  function toggleAll() {
    const next = !allAgreed
    setAgreed({ service: next, privacy: next, marketing: next })
  }

  async function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      await authApi.signUp({
        email: email.trim(),
        password,
        passwordConfirm,
        nickname: nickname.trim(),
        agreeToTerms: requiredAgreed,
      })
      // 가입 직후 바로 쓸 수 있도록 이어서 로그인까지 해준다.
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <img className="auth__logo" src={logoUrl} alt="ㄱㄱ 함께 사요" />
          <h1 className="auth__title">회원가입</h1>
        </div>

        <form className="auth__form" onSubmit={submit}>
          {error && <p className="auth__error">{error}</p>}

          <div className="field">
            <span className="field__label">이메일</span>
            <div className="auth__input-wrap">
              <input
                className={`input ${emailState === 'ok' ? 'input--ok' : ''} ${emailState === 'taken' ? 'input--error' : ''}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
              />
              {emailState === 'ok' && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 사용 가능
                </span>
              )}
              {emailState === 'taken' && <span className="auth__status auth__status--bad">이미 사용 중</span>}
              {emailState === 'checking' && <span className="auth__status auth__status--idle">확인 중</span>}
            </div>
          </div>

          <div className="field">
            <span className="field__label">비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="영문·숫자 포함 8자 이상"
              autoComplete="new-password"
            />
            <span className="field__help">영문, 숫자, 특수문자를 조합해 주세요.</span>
          </div>

          <div className="field">
            <span className="field__label">비밀번호 확인</span>
            <div className="auth__input-wrap">
              <input
                className={`input ${passwordMatched ? 'input--ok' : ''} ${
                  passwordConfirm && !passwordMatched ? 'input--error' : ''
                }`}
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
              />
              {passwordMatched && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 일치
                </span>
              )}
              {passwordConfirm && !passwordMatched && (
                <span className="auth__status auth__status--bad">불일치</span>
              )}
            </div>
          </div>

          <div className="field">
            <span className="field__label">닉네임</span>
            <div className="auth__input-wrap">
              <input
                className={`input ${nickState === 'ok' ? 'input--ok' : ''} ${nickState === 'taken' ? 'input--error' : ''}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="공구에서 사용할 이름"
                maxLength={50}
              />
              {nickState === 'ok' && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 사용 가능
                </span>
              )}
              {nickState === 'taken' && <span className="auth__status auth__status--bad">이미 사용 중</span>}
            </div>
          </div>

          <div className="terms">
            <button type="button" className="terms__all" onClick={toggleAll}>
              <span className={`terms__check ${allAgreed ? 'is-on' : ''}`}>
                <CheckIcon width={13} height={13} />
              </span>
              전체 동의합니다
            </button>

            <div className="terms__list">
              {TERMS.map((t) => (
                <label key={t.key} className="terms__row">
                  <span className={`terms__check ${agreed[t.key] ? 'is-on' : ''}`}>
                    <CheckIcon width={13} height={13} />
                    <input
                      type="checkbox"
                      checked={agreed[t.key]}
                      onChange={(e) => setAgreed((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                    />
                  </span>
                  <span className={`terms__tag ${t.required ? 'terms__tag--required' : ''}`}>
                    [{t.required ? '필수' : '선택'}]
                  </span>
                  {t.label}
                  <span className="terms__view">보기</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg auth__submit" disabled={!canSubmit}>
            {busy ? '가입 중…' : '회원가입'}
          </button>
        </form>

        <p className="auth__switch" style={{ marginTop: 20 }}>
          이미 회원이신가요?
          <Link to="/login">
            로그인 <ArrowRightIcon width={15} height={15} />
          </Link>
        </p>
      </div>
    </div>
  )
}
