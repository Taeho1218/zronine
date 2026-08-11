import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi, postApi } from '../api'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import HomeHero from '../components/HomeHero'
import { normalizeKeyword } from '../lib/search'
import './HomePage.css'

/**
 * 한 화면에 보여줄 카드 수. 3열 그리드라 4줄이 딱 떨어진다.
 * 서버 PostService.MAIN_FEED_PAGE_SIZE 와 같은 값이라 더 크게 보내도 서버가 여기까지 잘라준다.
 */
const PAGE_SIZE = 12

const QUICK_FILTERS = [
  { label: '진행 중', key: 'status', value: 'ONGOING' },
  { label: '진행 예정', key: 'status', value: 'UPCOMING' },
  { label: '셀러 글', key: 'postType', value: 'SELLER' },
  { label: '유저 글', key: 'postType', value: 'GENERAL' },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // 주소를 직접 고쳐 한 글자로 들어오는 경우가 있어 입력창과 같은 기준으로 한 번 더 거른다.
  const keyword = normalizeKeyword(searchParams.get('keyword'))
  const categoryId = searchParams.get('categoryId') ?? ''
  const postType = searchParams.get('postType') ?? ''
  const status = searchParams.get('status') ?? ''

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
        postType: postType || undefined,
        status: status || undefined,
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
  }, [keyword, categoryId, postType, status, page])

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

  /** 한 번에 하나의 빠른 필터만 적용하고, 선택된 필터를 다시 누르면 전체로 돌아간다. */
  function changeFilter(key, value) {
    updateParams((next) => {
      const isActive = next.get(key) === value
      next.delete('postType')
      next.delete('status')
      if (!isActive) next.set(key, value)
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
      <nav className="home__category-nav" aria-label="상품 카테고리">
        <button
          type="button"
          aria-current={!categoryId ? 'page' : undefined}
          className={`home__category-link ${!categoryId ? 'home__category-link--active' : ''}`}
          onClick={() => selectCategory(null)}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category.categoryId}
            type="button"
            aria-current={String(category.categoryId) === categoryId ? 'page' : undefined}
            className={`home__category-link ${
              String(category.categoryId) === categoryId ? 'home__category-link--active' : ''
            }`}
            onClick={() => selectCategory(category.categoryId)}
          >
            {category.name}
          </button>
        ))}
      </nav>

      {/* 좋아요 → 댓글 → 최신 순으로 뽑은 인기 공구. 모집이 끝난 글은 올라오지 않는다. */}
      <HomeHero />

      <section className="home__feed-heading" aria-labelledby="home-feed-title">
        <h2 id="home-feed-title" className="home__feed-title">
          지금 공구
        </h2>
        <div className="home__quick-filters" aria-label="게시글 필터">
          {QUICK_FILTERS.map((filter) => {
            const isActive = searchParams.get(filter.key) === filter.value
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={isActive}
                className={`home__quick-filter ${isActive ? 'home__quick-filter--active' : ''}`}
                onClick={() => changeFilter(filter.key, filter.value)}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </section>

      {keyword && (
        <p className="home__searched">
          <strong>‘{keyword}’</strong> 검색 결과 {totalElements}건
        </p>
      )}

      {loading && <Loading message="공구를 불러오는 중…" />}

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
