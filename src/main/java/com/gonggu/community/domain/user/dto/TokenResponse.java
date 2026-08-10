package com.gonggu.community.domain.user.dto;

/**
 * 로그인 / 재발급 응답 바디.
 *
 * refreshToken 은 여기 담지 않는다. httpOnly 쿠키로만 내려가야 자바스크립트가 절대 읽을 수 없고,
 * 그래야 XSS 로 페이지 안의 스크립트가 탈취되더라도 Refresh Token 까지 함께 털리지 않는다.
 * 프론트가 만료 시각을 직접 계산하지 않아도 되도록 accessTokenExpiresIn(초)은 그대로 내려준다.
 */
public record TokenResponse(
	String accessToken,
	String tokenType,
	long accessTokenExpiresIn,
	UserSummaryResponse user
) {

	public static TokenResponse of(String accessToken, long expiresIn, UserSummaryResponse user) {
		return new TokenResponse(accessToken, "Bearer", expiresIn, user);
	}
}
