/**
 * 카테고리를 화면에 늘어놓는 차례.
 *
 * 서버는 등록된 순서대로 내려준다(식품 → 기타 → 화장품 → 영양제 → 반려동물). 그대로 그리면
 * "기타" 가 두 번째에 오는 등 읽는 차례가 어색해서, 화면에서 쓸 순서를 여기서 정한다.
 * 서버 데이터는 건드리지 않으므로 분류가 새로 생겨도 목록에서 빠지지 않는다.
 */
const CATEGORY_ORDER = ['식품', '화장품', '영양제', '반려동물', '기타']

/** 여기 적히지 않은 이름은 "기타" 바로 앞에 이름순으로 들어간다 ("기타"는 늘 마지막이어야 읽힌다) */
function rankOf(name) {
  const index = CATEGORY_ORDER.indexOf(name)
  return index >= 0 ? index : CATEGORY_ORDER.indexOf('기타') - 0.5
}

export function sortCategories(list) {
  return [...(list ?? [])].sort(
    (a, b) => rankOf(a?.name) - rankOf(b?.name) || String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'ko'),
  )
}
