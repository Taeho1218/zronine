package com.gonggu.community.domain.post.dto;

import com.gonggu.community.domain.post.PostStatusFilter;
import com.gonggu.community.domain.post.PostType;

/**
 * 메인 페이지 필터 조건. 모든 필드가 선택값이며 null 이면 해당 조건을 걸지 않는다.
 */
public record PostSearchCondition(
	PostType postType,
	Integer categoryId,
	PostStatusFilter status,
	String keyword
) {
}
