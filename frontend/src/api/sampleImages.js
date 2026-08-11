/**
 * src/assets/samples/ 폴더를 통째로 읽어 데모 이미지 목록을 만든다.
 *
 * 확장자를 코드에 적지 않는 게 핵심이다. png 든 jpg 든 webp 든 폴더에 넣기만 하면 잡히고,
 * 파일을 추가/교체할 때 mock.js 를 고칠 일이 없다.
 *
 * public/ 이 아니라 src/ 아래에 두는 이유가 이것이다 — import.meta.glob 은 번들러가
 * 빌드 시점에 폴더를 훑어야 하므로, 가공 없이 통째로 복사되는 public/ 은 대상이 되지 않는다.
 * 덤으로 빌드 때 파일명에 해시가 붙어 캐시 문제도 없다.
 */
const modules = import.meta.glob('../assets/samples/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** '../assets/samples/post-1-2.png' → 'post-1-2' */
function baseName(path) {
  return path.split('/').pop().replace(/\.[^.]+$/, '')
}

const byName = new Map(Object.entries(modules).map(([path, url]) => [baseName(path), url]))

/**
 * 한 글에 딸린 이미지들을 순서대로 돌려준다.
 *
 *   sampleSet('post-1')  →  post-1, post-1-2, post-1-3 ... 순서로 (있는 것만)
 *
 * 대표 이미지는 접미사 없는 파일이고, 뒤에 -2, -3 을 붙인 것이 추가 이미지다.
 * 'post-1' 을 찾을 때 'post-10' 이 섞이지 않도록 접미사는 "-숫자" 형태만 인정한다.
 */
export function sampleSet(base) {
  const pattern = new RegExp(`^${base}(?:-(\\d+))?$`)

  return [...byName.entries()]
    .map(([name, url]) => ({ url, order: Number(pattern.exec(name)?.[1] ?? 1), matched: pattern.test(name) }))
    .filter((entry) => entry.matched)
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.url)
}
