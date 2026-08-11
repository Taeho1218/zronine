/**
 * 검색어 최소 길이. 한 글자로는 결과가 너무 넓게 걸려 의미가 없다.
 *
 * 입력창(Header)과 목록(HomePage) 두 곳이 같은 기준을 써야 한다.
 * 입력창만 막으면 주소창에 ?keyword=ㄱ 처럼 직접 넣었을 때 그대로 통과해버린다.
 */
export const MIN_KEYWORD_LENGTH = 2

/** 검색에 쓸 수 있는 값이면 다듬어서, 아니면 빈 문자열을 준다. */
export function normalizeKeyword(raw) {
  const value = (raw ?? '').trim()
  return value.length >= MIN_KEYWORD_LENGTH ? value : ''
}
