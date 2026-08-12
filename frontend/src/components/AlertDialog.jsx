import { useEffect, useRef } from 'react'
import Loading from './Loading'
import { CheckIcon } from './icons'
import './AlertDialog.css'

/**
 * 알려주기만 하는 확인 창.
 *
 * loading 이면 같은 창 안에서 마스코트가 돌고, 일이 끝나면 그 자리에 결과 문구와 확인 버튼이 들어선다.
 * 창을 새로 띄우지 않고 안쪽만 바꾸는 이유: 저장을 누른 자리에서 진행 상황과 결과가 이어져 보이고,
 * 끝나는 순간 창이 깜빡이며 다시 뜨지 않는다.
 *
 * 버튼이 "확인" 하나뿐이라 고를 것이 없다. 그래서 Esc 나 바깥을 눌러도 확인과 같게 처리한다 —
 * 닫는 것 말고 할 수 있는 게 없는데 방법마다 결과가 다르면 오히려 헷갈린다.
 * 다만 진행 중에는 어느 쪽도 받지 않는다. 아직 끝나지 않은 일을 닫는 셈이 되기 때문이다.
 */
export default function AlertDialog({
  loading = false,
  loadingLabel = '처리하는 중…',
  title,
  description,
  confirmLabel = '확인',
  onConfirm,
}) {
  const confirmRef = useRef(null)
  /*
   * 부모가 매 렌더 새 함수를 넘겨도 아래 effect 가 다시 돌지 않도록 최신 값만 담아둔다.
   * (다시 돌면 그때마다 스크롤 잠금이 풀렸다 걸린다)
   */
  const latestConfirm = useRef(onConfirm)
  latestConfirm.current = onConfirm
  const loadingRef = useRef(loading)
  loadingRef.current = loading

  useEffect(() => {
    function onKeyDown(e) {
      if (loadingRef.current) return
      if (e.key === 'Escape' || e.key === 'Enter') latestConfirm.current?.()
    }
    document.addEventListener('keydown', onKeyDown)
    // 창이 떠 있는 동안 뒤 화면이 따라 스크롤되지 않게 막는다
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [])

  // 확인 버튼은 일이 끝난 뒤에 생기므로, 생기는 그때 포커스를 준다 (Enter 로 바로 넘어갈 수 있게)
  useEffect(() => {
    if (!loading) confirmRef.current?.focus()
  }, [loading])

  return (
    <div
      className="adlg"
      role="alertdialog"
      aria-modal="true"
      aria-busy={loading}
      aria-label={loading ? loadingLabel : title}
    >
      <div className="adlg__dim" onClick={() => !loading && latestConfirm.current?.()} />

      <div className="adlg__panel">
        {loading ? (
          <Loading size={72} message={loadingLabel} className="adlg__loading" />
        ) : (
          <>
            <span className="adlg__mark" aria-hidden="true">
              <CheckIcon width={22} height={22} />
            </span>

            <h2 className="adlg__title">{title}</h2>
            {description && <p className="adlg__desc">{description}</p>}

            <button
              type="button"
              ref={confirmRef}
              className="btn btn--primary adlg__confirm"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
