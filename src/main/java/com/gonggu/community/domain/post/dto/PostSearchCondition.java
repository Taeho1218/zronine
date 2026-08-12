package com.gonggu.community.domain.post.dto;

import com.gonggu.community.domain.post.PostSortFilter;
import com.gonggu.community.domain.post.PostStatusFilter;
import com.gonggu.community.domain.post.PostType;

/**
 * 메인 페이지 필터 조건. postType/categoryId/status/keyword 는 선택값이며 null 이면 해당 조건을 걸지 않는다.
 * sortBy 는 목록에 걸리는 글 자체는 바꾸지 않고 순서만 바꾸는 값이라 null 이면 LATEST 로 본다.
 */
public record PostSearchCondition(
	PostType postType,
	Integer categoryId,
	PostStatusFilter status,
	String keyword,
	PostSortFilter sortBy
) {
}
