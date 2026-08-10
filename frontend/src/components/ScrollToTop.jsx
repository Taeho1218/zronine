import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 라우트가 바뀌면 맨 위로 올린다.
 * 다만 #comments 처럼 앵커로 이동하는 경우는 브라우저 기본 동작을 방해하지 않는다.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return null
}
