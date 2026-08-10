package com.gonggu.community.domain.category.dto;

import com.gonggu.community.domain.category.Category;

public record CategoryResponse(
	Integer categoryId,
	String name
) {

	public static CategoryResponse from(Category category) {
		return new CategoryResponse(category.getId(), category.getName());
	}
}
