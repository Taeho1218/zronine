package com.gonggu.community.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenReissueRequest(

	@NotBlank(message = "리프레시 토큰이 필요합니다.")
	String refreshToken
) {
}
