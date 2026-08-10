package com.gonggu.community.domain.user.dto;

/**
 * 로그인/재발급 처리 결과를 서비스에서 컨트롤러로 넘길 때 쓰는 내부 전달용 타입.
 * refreshToken 은 여기 담겨 있을 뿐 TokenResponse(실제 응답 바디)에는 들어가지 않는다.
 * 컨트롤러가 이 값을 httpOnly 쿠키로만 내려보내고, 자바스크립트가 읽을 수 있는
 * JSON 바디에는 절대 실지 않기 위해서다.
 */
public record AuthResult(
	TokenResponse body,
	String refreshToken,
	long refreshTokenValiditySeconds
) {
}
