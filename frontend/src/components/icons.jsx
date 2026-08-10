/**
 * 시안의 아이콘은 전부 얇은 라인 스타일이라 stroke 기반 SVG 로 통일했다.
 * 아이콘 파일/폰트를 추가로 받지 않도록 인라인으로 둔다. (currentColor 를 따르므로 색은 CSS 로 제어)
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const SearchIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const BellIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </svg>
)

export const BookmarkIcon = ({ filled = false, ...props }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M18 21 12 17l-6 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
  </svg>
)

export const HeartIcon = ({ filled = false, ...props }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1" />
  </svg>
)

export const ThumbsUpIcon = ({ filled = false, ...props }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M7 22V10l5-8a2.5 2.5 0 0 1 2.5 2.5V9h4.6a2 2 0 0 1 2 2.3l-1.2 8a2 2 0 0 1-2 1.7z" />
    <path d="M7 10H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </svg>
)

export const CommentIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 20.5l1.5-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4" />
  </svg>
)

export const LockIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

export const PlusIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const ImageIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </svg>
)

export const ExternalLinkIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export const CheckIcon = (props) => (
  <svg {...base} strokeWidth={2.4} {...props}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

export const ClockIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.3l3.3 2" />
  </svg>
)

export const CloseIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ArrowRightIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const TrashIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
)
