package com.gonggu.community.domain.user.dto;

import jakarta.validation.constraints.Size;

/**
 * 프로필 수정. 세 필드 모두 null 이면 "변경하지 않음"으로 처리한다.
 * profileImageUrl/instagramUrl 에 빈 문자열을 보내면 값을 지우라는 의미로 해석해 null 로 저장한다.
 */
public record UserUpdateRequest(

	@Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하여야 합니다.")
	String nickname,

	@Size(max = 512, message = "이미지 URL이 너무 깁니다.")
	String profileImageUrl,

	@Size(max = 255, message = "인스타그램 주소가 너무 깁니다.")
	String instagramUrl
) {
}
