import './Pagination.css'

/**
 * 페이지 번호 이동. page 는 서버와 같은 0부터 시작하는 번호이고, 화면에는 1부터 보여준다.
 *
 * 페이지가 많아져도 번호 줄이 길어지지 않도록 현재 위치 주변만 펼치고 나머지는 "…" 로 접는다.
 */
const WINDOW = 1 // 현재 페이지 좌우로 몇 개까지 펼칠지

function buildPages(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }

  const pages = new Set([0, totalPages - 1, page])
  for (let i = 1; i <= WINDOW; i++) {
    if (page - i >= 0) pages.add(page - i)
    if (page + i <= totalPages - 1) pages.add(page + i)
  }

  const sorted = [...pages].sort((a, b) => a - b)

  // 번호가 건너뛰는 자리에 생략 표시를 끼워 넣는다.
  const withGaps = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) withGaps.push('gap')
    withGaps.push(n)
  })
  return withGaps
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  const items = buildPages(page, totalPages)

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label="이전 페이지"
      >
        이전
      </button>

      <ul className="pagination__list">
        {items.map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`pagination__page ${item === page ? 'is-current' : ''}`}
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`${item + 1}페이지`}
              >
                {item + 1}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="pagination__arrow"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="다음 페이지"
      >
        다음
      </button>
    </nav>
  )
}
