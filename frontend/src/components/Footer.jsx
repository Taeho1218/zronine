import { Link } from 'react-router-dom'
import symbolUrl from '../assets/brand/gg_symbol.svg'
import './Footer.css'

/**
 * 모든 화면 아래에 깔리는 푸터.
 *
 * 실제로 열리는 곳만 링크로 둔다. 이용약관·개인정보처리방침처럼 아직 페이지가 없는 항목은
 * 눌러도 아무 일이 없는 링크가 되어 오히려 신뢰를 깎으므로 넣지 않았다.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner page">
        <div className="footer__brand">
          <span className="footer__logo">
            <img src={symbolUrl} alt="" />
            ㄱㄱ
          </span>
          <p className="footer__tagline">함께 사요</p>
          <p className="footer__desc">여기저기 흩어진 공동구매를 한곳에 모아 봅니다.</p>
        </div>

        <nav className="footer__nav" aria-label="푸터 메뉴">
          <div className="footer__group">
            <h2 className="footer__group-title">둘러보기</h2>
            <Link to="/">전체 공구</Link>
            <Link to="/?status=ONGOING">진행중인 공구</Link>
            <Link to="/?status=UPCOMING">예정된 공구</Link>
          </div>

          <div className="footer__group">
            <h2 className="footer__group-title">내 활동</h2>
            <Link to="/write">공구 열기</Link>
            <Link to="/mypage">마이페이지</Link>
            <Link to="/mypage?tab=saved">저장한 공구</Link>
          </div>
        </nav>
      </div>

      <div className="footer__bottom page">
        <p>© 2026 ㄱㄱ</p>
        <p className="footer__note">공동구매 정보는 각 판매자가 올린 내용이며, 거래는 원 판매처에서 이뤄집니다.</p>
      </div>
    </footer>
  )
}
