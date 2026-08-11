import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi, postApi } from '../api'
import PostCard from '../components/PostCard'
import Pagination from '../components/Pagination'
import { normalizeKeyword } from '../lib/search'
import './HomePage.css'

/** 서버 한 페이지 크기와 같다 (PostService.MAX_PAGE_SIZE). */
const PAGE_SIZE = 15

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // 주소를 직접 고쳐 한 글자로 들어오는 경우가 있어 입력창과 같은 기준으로 한 번 더 거른다.
  const keyword = normalizeKeyword(searchParams.get('keyword'))
  const categoryId = searchParams.get('categoryId') ?? ''

  // 주소에는 사람이 읽는 1부터의 번호를 쓰고, 서버에는 0부터의 번호를 보낸다.
  // 페이지를 주소에 담아둬야 새로고침·뒤로가기·링크 공유가 모두 같은 화면을 가리킨다.
  const page = Math.max(0, Number(searchParams.get('page') ?? 1) - 1)

  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    categoryApi
      .list()
      .then((list) => setCategories(list ?? []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    postApi
      .list({
        page,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
      })
      .then((res) => {
        if (!alive) return
        const pages = res?.totalPages ?? 1
        // 주소창에 범위를 넘는 번호가 찍혀 있으면(글이 지워졌거나 링크를 손댄 경우)
        // 빈 화면 대신 마지막 페이지로 되돌린다.
        if (pages > 0 && page >= pages) {
          goToPage(pages - 1)
          return
        }
        setPosts(res?.content ?? [])
        setTotalPages(pages)
        setTotalElements(res?.totalElements ?? 0)
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [keyword, categoryId, page])

  /** 필터를 바꾸면 보던 페이지 번호는 의미가 없어지므로 함께 지운다. */
  function updateParams(mutate) {
    const next = new URLSearchParams(searchParams)
    mutate(next)
    next.delete('page')
    setSearchParams(next)
  }

  function selectCategory(id) {
    updateParams((next) => {
      if (id == null) next.delete('categoryId')
      else next.set('categoryId', String(id))
    })
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 0) next.delete('page')
    else next.set('page', String(nextPage + 1))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <strong>‘{keyword}’</strong> 검색 결과 {totalElements}건
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

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  )
}
