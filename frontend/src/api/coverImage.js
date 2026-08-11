/**
 * 프로필 커버 사진.
 *
 * 서버에 커버 이미지를 올리는 기능이 아직 없어서, 샘플 이미지와 같은 방식으로
 * `src/assets/cover/` 에 사진 파일 하나를 넣어두면 그게 기본 커버가 된다.
 * 파일 이름은 상관없고, 여러 장이 있으면 이름 순으로 첫 번째를 쓴다.
 * 폴더가 비어 있으면 null 이라 헤더가 브랜드 색 그라데이션으로 돌아간다.
 */
const modules = import.meta.glob(
  '../assets/cover/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}',
  { eager: true, query: '?url', import: 'default' },
)

const first = Object.keys(modules).sort()[0]

export const coverImage = first ? modules[first] : null
