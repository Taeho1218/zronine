package com.gonggu.community.domain.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(

	@NotBlank(message = "카테고리 이름을 입력해주세요.")
	@Size(max = 50, message = "카테고리 이름은 50자를 넘을 수 없습니다.")
	String name
) {
}
