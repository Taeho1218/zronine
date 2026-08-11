import { useEffect, useState } from 'react'
import { useBusy } from '../lib/useBusy'
import { CloseIcon } from './icons'
import './WithdrawDialog.css'

/**
 * 탈퇴 확인 창.
 *
 * 되돌리기 어려운 동작이라 한 번 더 묻는다. 버튼만 누르면 끝나지 않도록
 * 닉네임을 그대로 입력해야 탈퇴 버튼이 열린다 — 실수로 눌러 계정을 잃는 일을 막기 위함이다.
 */
export default function WithdrawDialog({ nickname, onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState(null)
  const [busy, run] = useBusy()

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [busy, onClose])

  const matched = typed.trim() === nickname

  function submit(e) {
    e.preventDefault()
    if (!matched) return
    run(async () => {
      setError(null)
      try {
        await onConfirm()
      } catch (err) {
        setError(err.message)
      }
    })
  }

  return (
    <div className="wd" role="dialog" aria-modal="true" aria-label="회원 탈퇴 확인">
      <div className="wd__dim" onClick={() => !busy && onClose()} />

      <form className="wd__panel" onSubmit={submit}>
        <header className="wd__head">
          <h2 className="wd__title">정말 탈퇴하시겠어요?</h2>
          <button type="button" className="wd__close" onClick={onClose} disabled={busy} aria-label="닫기">
            <CloseIcon width={18} height={18} />
          </button>
        </header>

        <ul className="wd__points">
          <li>계정은 <strong>30일간 보관</strong>된 뒤 완전히 삭제됩니다.</li>
          <li>그 사이에는 문의를 통해 복구할 수 있어요.</li>
          <li>작성한 공구와 댓글은 더 이상 관리할 수 없습니다.</li>
        </ul>

        <label className="field wd__field">
          <span className="field__label">
            확인을 위해 <strong className="wd__echo">{nickname}</strong> 을(를) 입력해주세요
          </span>
          <input
            className={`input ${typed && !matched ? 'input--error' : ''}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={nickname}
            autoFocus
            disabled={busy}
          />
        </label>

        {error && <p className="field__error">{error}</p>}

        <div className="wd__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button type="submit" className="wd__confirm" disabled={!matched || busy}>
            {busy ? '처리 중…' : '탈퇴하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
