package com.gonggu.community.domain.user.dto;

/**
 * 로그인 / 재발급 응답.
 * 프론트가 만료 시각을 직접 계산하지 않아도 되도록 accessTokenExpiresIn(초)을 함께 내려준다.
 */
public record TokenResponse(
	String accessToken,
	String refreshToken,
	String tokenType,
	long accessTokenExpiresIn,
	UserSummaryResponse user
) {

	public static TokenResponse of(String accessToken, String refreshToken, long expiresIn, UserSummaryResponse user) {
		return new TokenResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
	}
}
