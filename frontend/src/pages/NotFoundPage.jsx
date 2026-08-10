import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="state">
      <p className="state__title">페이지를 찾을 수 없어요.</p>
      <p>주소가 바뀌었거나 삭제된 글일 수 있어요.</p>
      <Link className="btn btn--primary" to="/" style={{ marginTop: 12 }}>
        홈으로
      </Link>
    </div>
  )
}
