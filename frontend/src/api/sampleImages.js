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
// 확장자는 대소문자를 모두 적어야 한다. 글롭 패턴에는 대소문자 무시 옵션이 없어서
// .PNG 처럼 대문자로 저장된 파일이 조용히 빠지기 때문이다.
const modules = import.meta.glob(
  '../assets/samples/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF}',
  { eager: true, query: '?url', import: 'default' },
)

/** '../assets/samples/post-1-2.png' → 'post-1-2' */
function baseName(path) {
  return path.split('/').pop().replace(/\.[^.]+$/, '')
}

const byName = new Map(Object.entries(modules).map(([path, url]) => [baseName(path), url]))

/** 이름 하나로 묶이는 이미지들을 순서대로 찾는다. 없으면 빈 배열. */
function matchByBase(base) {
  // 'gb-002' 를 찾을 때 'gb-0021' 이 섞이지 않도록 접미사는 "-숫자" 형태만 인정한다.
  const pattern = new RegExp(`^${base}(?:-(\\d+))?$`, 'i')

  return [...byName.entries()]
    .filter(([name]) => pattern.test(name))
    .map(([name, url]) => ({ url, order: Number(pattern.exec(name)?.[1] ?? 1) }))
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.url)
}

/**
 * 한 글에 딸린 이미지들을 순서대로 돌려준다.
 *
 *   sampleSet('gb-002', 'post-2')  →  둘 중 파일이 있는 이름 규칙을 골라서
 *                                      gb-002, gb-002-2, gb-002-3 ... 순으로
 *
 * 대표 이미지는 접미사 없는 파일이고, 뒤에 -2, -3 을 붙인 것이 추가 이미지다.
 * 이름 후보를 여러 개 받는 이유는, 파일을 어떤 규칙으로 저장하든(공구 코드든 글 번호든)
 * mock.js 를 고치지 않고 그대로 붙게 하기 위해서다. 앞에 적은 후보가 우선한다.
 * 대소문자는 구분하지 않는다 (GB-002.png 도 잡힌다).
 */
export function sampleSet(...bases) {
  for (const base of bases) {
    if (!base) continue
    const found = matchByBase(base)
    if (found.length > 0) return found
  }
  return []
}
