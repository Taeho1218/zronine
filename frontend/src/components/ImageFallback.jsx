import mascotUrl from '../assets/brand/gonggu-mascot-color.svg'
import './ImageFallback.css'

/**
 * 이미지가 없거나 주소가 죽었을 때 그 자리에 대신 놓는 마스코트.
 *
 * 빈 회색 칸이나 깨진 이미지 아이콘 대신 브랜드 마스코트를 보여주면
 * "아직 사진이 없다"는 사실이 사고처럼 보이지 않는다.
 *
 * size 를 주면 그 크기의 정사각형이 되고(작은 썸네일용), 주지 않으면
 * 너비를 꽉 채운 뒤 className 의 비율(--card, --hero)을 따른다.
 */
export default function ImageFallback({ className = '', size }) {
  const fixed = size != null

  return (
    <div
      className={`imgfallback ${fixed ? 'imgfallback--fixed' : ''} ${className}`}
      style={fixed ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <img className="imgfallback__mascot" src={mascotUrl} alt="" />
    </div>
  )
}
