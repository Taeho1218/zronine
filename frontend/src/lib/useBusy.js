import { useCallback, useRef, useState } from 'react'

/**
 * 요청이 끝날 때까지 같은 동작을 다시 실행하지 못하게 막는다.
 *
 * 추천/저장/팔로우처럼 토글되는 버튼은 연타하면 POST 와 DELETE 가 뒤엉켜
 * 서버 상태와 화면이 어긋나기 쉽다. (이미 추천한 글에 또 추천 → ALREADY_LIKED 등)
 *
 * busy 상태값만으로 막지 않고 ref 를 함께 두는 이유는,
 * setState 가 즉시 반영되지 않아 같은 틱에 들어온 두 번째 클릭이 검사를 통과해버리기 때문이다.
 * ref 는 동기적으로 바뀌므로 실제 차단은 ref 가 담당하고, busy 는 버튼을 비활성화하는 표시용이다.
 *
 *   const [busy, run] = useBusy()
 *   <button disabled={busy} onClick={() => run(async () => { ... })} />
 */
export function useBusy() {
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const run = useCallback(async (task) => {
    if (inFlight.current) return undefined
    inFlight.current = true
    setBusy(true)
    try {
      return await task()
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }, [])

  return [busy, run]
}
