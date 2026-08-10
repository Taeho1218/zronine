import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi, postApi } from '../api'
import PostCard from '../components/PostCard'
import './HomePage.css'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''

  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [nextPage, setNextPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    categoryApi
      .list()
      .then((list) => setCategories(list ?? []))
      .catch(() => setCategories([]))
  }, [])

  // 필터가 바뀌면 목록을 처음부터 다시 받는다.
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    postApi
      .list({ page: 0, keyword: keyword || undefined, categoryId: categoryId || undefined })
      .then((page) => {
        if (!alive) return
        setPosts(page?.content ?? [])
        setNextPage(page?.nextPage ?? null)
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [keyword, categoryId])

  const loadMore = useCallback(async () => {
    if (nextPage == null || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await postApi.list({
        page: nextPage,
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
      })
      setPosts((prev) => [...prev, ...(page?.content ?? [])])
      setNextPage(page?.nextPage ?? null)
    } catch {
      // 더 불러오기 실패는 목록 전체를 지우지 않고 조용히 멈춘다.
      setNextPage(null)
    } finally {
      setLoadingMore(false)
    }
  }, [nextPage, loadingMore, keyword, categoryId])

  // 목록 끝의 감시 요소가 보이면 다음 페이지를 이어 붙인다.
  const sentinelRef = useRef(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || nextPage == null) return undefined
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: '240px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, nextPage])

  function selectCategory(id) {
    const next = new URLSearchParams(searchParams)
    if (id == null) next.delete('categoryId')
    else next.set('categoryId', String(id))
    setSearchParams(next)
  }

  return (
    <div className="home page">
      <div className="home__chips" role="tablist" aria-label="카테고리">
        <button
          type="button"
          role="tab"
          aria-selected={!categoryId}
          className={`chip ${!categoryId ? 'chip--active' : ''}`}
          onClick={() => selectCategory(null)}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c.categoryId}
            type="button"
            role="tab"
            aria-selected={String(c.categoryId) === categoryId}
            className={`chip ${String(c.categoryId) === categoryId ? 'chip--active' : ''}`}
            onClick={() => selectCategory(c.categoryId)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {keyword && (
        <p className="home__searched">
          <strong>‘{keyword}’</strong> 검색 결과
        </p>
      )}

      {loading && (
        <div className="state">
          <span className="spinner" />
          <span>공구를 불러오는 중…</span>
        </div>
      )}

      {!loading && error && (
        <div className="state">
          <p className="state__title">목록을 불러오지 못했어요.</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="state">
          <p className="state__title">아직 등록된 공구가 없어요.</p>
          <p>첫 번째 공구를 열어보세요.</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="home__grid">
            {posts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>
          <div ref={sentinelRef} className="home__sentinel">
            {loadingMore && <span className="spinner" />}
          </div>
        </>
      )}
    </div>
  )
}
