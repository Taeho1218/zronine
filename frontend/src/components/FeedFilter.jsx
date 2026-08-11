import { useEffect, useRef, useState } from 'react'
import './FeedFilter.css'

/**
 * 서버가 받는 두 갈래 필터.
 * postType 은 누가 쓴 글인지, status 는 모집이 어느 단계인지를 가른다.
 * 값이 없으면(=전체) 파라미터 자체를 보내지 않아 조건이 걸리지 않는다.
 */
const GROUPS = [
  {
    key: 'postType',
    label: '글 종류',
    options: [
      { value: '', label: '전체' },
      { value: 'SELLER', label: '셀러' },
      { value: 'GENERAL', label: '유저' },
    ],
  },
  {
    key: 'status',
    label: '모집 상태',
    options: [
      { value: '', label: '전체' },
      { value: 'ONGOING', label: '진행중인 공구' },
      { value: 'UPCOMING', label: '예정된 공구' },
    ],
  },
]

const labelOf = (key, value) =>
  GROUPS.find((g) => g.key === key).options.find((o) => o.value === value)?.label ?? '전체'

/**
 * 카테고리 칩 왼쪽에 놓이는 필터. 지금 무엇으로 좁혀 보고 있는지를 버튼에 그대로 적는다.
 * (아무것도 고르지 않았으면 "전체")
 */
export default function FeedFilter({ postType, status, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // 고른 것만 골라 "셀러 | 진행중인 공구" 처럼 잇는다.
  const picked = [
    postType && labelOf('postType', postType),
    status && labelOf('status', status),
  ].filter(Boolean)
  const summary = picked.length > 0 ? picked.join(' | ') : '전체'
  const active = picked.length > 0

  return (
    <div className="feedfilter" ref={rootRef}>
      <button
        type="button"
        className={`feedfilter__trigger ${active ? 'is-active' : ''} ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {summary}
        <svg className="feedfilter__caret" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="feedfilter__panel">
          {GROUPS.map((group) => {
            const value = group.key === 'postType' ? postType : status
            return (
              <div key={group.key} className="feedfilter__group">
                <p className="feedfilter__group-label">{group.label}</p>
                <div className="feedfilter__options">
                  {group.options.map((option) => (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      className={`feedfilter__option ${value === option.value ? 'is-on' : ''}`}
                      onClick={() => onChange(group.key, option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {active && (
            <button
              type="button"
              className="feedfilter__reset"
              onClick={() => {
                onChange('reset')
                setOpen(false)
              }}
            >
              선택 해제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
