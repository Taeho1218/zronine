package com.gonggu.community.domain.post;

/**
 * posts.post_type ENUM('SELLER','GENERAL') 과 1:1 대응.
 *
 * 셀러글과 일반글은 화면 구성만 다를 뿐 댓글/좋아요/저장 동작이 동일해서 한 테이블로 통합했다.
 * 그 대가로 셀러 전용 컬럼이 전부 Nullable 이 되었으므로,
 * "SELLER 면 이 값들이 반드시 있어야 한다"는 검증은 DB 가 아니라 서비스 레이어가 책임진다.
 */
public enum PostType {
	SELLER,
	GENERAL
}
