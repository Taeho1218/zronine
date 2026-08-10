package com.gonggu.community.domain.user.dto;

/**
 * 회원가입/프로필 수정 화면의 중복체크 버튼 응답.
 */
public record NicknameCheckResponse(
	String value,
	boolean available
) {
}
