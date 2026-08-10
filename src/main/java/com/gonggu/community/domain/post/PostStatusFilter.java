package com.gonggu.community.domain.post;

/**
 * 메인 페이지의 진행중/진행예정 필터.
 * 기준 시각을 DB 의 NOW() 가 아니라 애플리케이션에서 넘긴 값으로 통일해
 * 목록 조회와 상세 응답의 상태 표시가 어긋나지 않게 한다.
 */
public enum PostStatusFilter {
	/** post_type='SELLER' AND NOW() BETWEEN start_date AND end_date */
	ONGOING,
	/** post_type='SELLER' AND start_date > NOW() */
	UPCOMING,
	/** 기간 조건 없이 전체 */
	ALL
}
