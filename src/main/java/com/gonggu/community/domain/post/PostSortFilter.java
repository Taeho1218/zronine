package com.gonggu.community.domain.post;

/**
 * 메인 페이지 피드의 정렬 기준.
 * postType/category/status/keyword 필터와 독립적으로 조합되며, 목록에 걸리는 글 자체는 바꾸지 않고
 * 순서만 바꾼다.
 */
public enum PostSortFilter {
	/** 기본값. 최신 글부터 (post_id DESC) */
	LATEST,
	/** 좋아요 많은 순 → 같으면 댓글 많은 순 → 그것도 같으면 최신순 */
	POPULAR
}
