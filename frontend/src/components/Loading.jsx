import mascotUrl from '../assets/brand/gonggu-mascot-animated.svg'
import './Loading.css'

/**
 * 불러오는 동안 보여주는 화면.
 *
 * 도는 원 대신 마스코트를 띄운다. 애니메이션은 SVG 파일 안의 CSS 라
 * <img> 로 넣어도 그대로 움직이고, 파일 하나만 캐시되면 어디서 몇 번을 써도 추가 비용이 없다.
 *
 * size 는 화면 전체를 기다릴 때(120)와 목록 일부만 기다릴 때(64)를 구분하려고 둔다.
 */
export default function Loading({ message, size = 120, className = '' }) {
  return (
    <div className={`state loading ${className}`}>
      <img className="loading__mascot" src={mascotUrl} alt="" style={{ width: size }} />
      {/* 화면 낭독기에는 그림 대신 이 문구가 읽힌다 */}
      <p className="loading__text" role="status">
        {message ?? '불러오는 중…'}
      </p>
    </div>
  )
}
