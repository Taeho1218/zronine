import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, userApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import { ArrowRightIcon, CheckIcon } from '../components/icons'
import logoUrl from '../assets/brand/gg_tagline.png'
import './AuthPages.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 비밀번호 규칙. 안내 문구("영문, 숫자, 특수문자를 조합해 주세요")와 실제 검사를 일치시킨다.
 * 길이 범위는 서버 SignUpRequest 의 @Size(min = 4, max = 64) 와 같다 — 둘 중 하나만 바꾸면
 * 화면에서는 통과했는데 서버가 400 으로 되돌리는 상황이 되므로 항상 같이 고쳐야 한다.
 *
 * 무엇이 부족한지 콕 집어 알려줘야 사용자가 몇 번씩 고쳐 넣지 않는다.
 */
const MIN_LENGTH = 4
const MAX_LENGTH = 64

function passwordProblem(value) {
  if (!value) return '비밀번호를 입력해주세요.'
  if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
    return `비밀번호는 ${MIN_LENGTH}자 이상 ${MAX_LENGTH}자 이하여야 해요.`
  }

  const missing = []
  if (!/[A-Za-z]/.test(value)) missing.push('영문')
  if (!/\d/.test(value)) missing.push('숫자')
  if (!/[^A-Za-z0-9]/.test(value)) missing.push('특수문자')

  return missing.length ? `${missing.join(', ')}를 포함해주세요.` : null
}

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
  const [busy, run] = useBusy()

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

  /** 칸마다 무엇이 잘못됐는지. 값이 null 이면 통과다. */
  const errors = useMemo(
    () => ({
      email: !email.trim()
        ? '이메일을 입력해주세요.'
        : !EMAIL_RE.test(email.trim())
          ? '이메일 형식이 올바르지 않아요. (예: name@example.com)'
          : emailState === 'taken'
            ? '이미 사용 중인 이메일이에요.'
            : null,
      password: passwordProblem(password),
      passwordConfirm: !passwordConfirm
        ? '비밀번호를 한 번 더 입력해주세요.'
        : !passwordMatched
          ? '비밀번호가 일치하지 않아요.'
          : null,
      nickname: !nickname.trim()
        ? '닉네임을 입력해주세요.'
        : nickname.trim().length < 2
          ? '닉네임은 2자 이상이어야 해요.'
          : nickState === 'taken'
            ? '이미 사용 중인 닉네임이에요.'
            : null,
      terms: requiredAgreed ? null : '필수 약관에 동의해주세요.',
    }),
    [email, emailState, password, passwordConfirm, passwordMatched, nickname, nickState, requiredAgreed],
  )

  const hasError = Object.values(errors).some(Boolean)

  /**
   * 아직 건드리지도 않은 칸을 처음부터 빨갛게 칠하면 겁만 준다.
   * 그래서 한 번 입력했다가 벗어났거나(touched), 가입 버튼을 눌러본 뒤(submitted)에만 표시한다.
   */
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }))
  const errorOf = (key) => ((touched[key] || submitted) && errors[key]) || null

  function toggleAll() {
    const next = !allAgreed
    setAgreed({ service: next, privacy: next, marketing: next })
  }

  function submit(e) {
    e.preventDefault()
    setSubmitted(true)

    // 버튼을 막아두는 대신 눌러보게 하고, 어디가 문제인지 빨갛게 알려준다.
    if (hasError) {
      document.querySelector('.input--error')?.focus()
      return
    }

    run(async () => {
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
      }
    })
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
            <span className="field__label">
              이메일 <i className="req">*</i>
            </span>
            <div className="auth__input-wrap">
              <input
                className={`input ${emailState === 'ok' && !errors.email ? 'input--ok' : ''} ${
                  errorOf('email') ? 'input--error' : ''
                }`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                aria-invalid={!!errorOf('email')}
              />
              {emailState === 'ok' && !errors.email && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 사용 가능
                </span>
              )}
              {emailState === 'checking' && <span className="auth__status auth__status--idle">확인 중</span>}
            </div>
            {errorOf('email') && <span className="field__error">{errorOf('email')}</span>}
          </div>

          <div className="field">
            <span className="field__label">
              비밀번호 <i className="req">*</i>
            </span>
            <div className="auth__input-wrap">
              <input
                className={`input ${password && !errors.password ? 'input--ok' : ''} ${
                  errorOf('password') ? 'input--error' : ''
                }`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched('password')}
                placeholder={`영문·숫자·특수문자 포함 ${MIN_LENGTH}자 이상`}
                autoComplete="new-password"
                aria-invalid={!!errorOf('password')}
              />
              {password && !errors.password && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 사용 가능
                </span>
              )}
            </div>
            {errorOf('password') ? (
              <span className="field__error">{errorOf('password')}</span>
            ) : (
              <span className="field__help">영문, 숫자, 특수문자를 모두 포함해 주세요.</span>
            )}
          </div>

          <div className="field">
            <span className="field__label">
              비밀번호 확인 <i className="req">*</i>
            </span>
            <div className="auth__input-wrap">
              <input
                className={`input ${passwordMatched ? 'input--ok' : ''} ${
                  errorOf('passwordConfirm') ? 'input--error' : ''
                }`}
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onBlur={() => markTouched('passwordConfirm')}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                aria-invalid={!!errorOf('passwordConfirm')}
              />
              {passwordMatched && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 일치
                </span>
              )}
            </div>
            {errorOf('passwordConfirm') && (
              <span className="field__error">{errorOf('passwordConfirm')}</span>
            )}
          </div>

          <div className="field">
            <span className="field__label">
              닉네임 <i className="req">*</i>
            </span>
            <div className="auth__input-wrap">
              <input
                className={`input ${nickState === 'ok' && !errors.nickname ? 'input--ok' : ''} ${
                  errorOf('nickname') ? 'input--error' : ''
                }`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={() => markTouched('nickname')}
                placeholder="공구에서 사용할 이름"
                maxLength={50}
                aria-invalid={!!errorOf('nickname')}
              />
              {nickState === 'ok' && !errors.nickname && (
                <span className="auth__status auth__status--ok">
                  <CheckIcon width={14} height={14} /> 사용 가능
                </span>
              )}
              {nickState === 'checking' && <span className="auth__status auth__status--idle">확인 중</span>}
            </div>
            {errorOf('nickname') && <span className="field__error">{errorOf('nickname')}</span>}
          </div>

          <div className={`terms ${errorOf('terms') ? 'terms--error' : ''}`}>
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

          {errorOf('terms') && <span className="field__error">{errorOf('terms')}</span>}

          {/* 버튼을 막지 않는다. 눌러봐야 어디가 문제인지 알 수 있기 때문이다. */}
          <button type="submit" className="btn btn--primary btn--block btn--lg auth__submit" disabled={busy}>
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
