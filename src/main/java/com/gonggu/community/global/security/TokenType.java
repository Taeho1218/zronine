package com.gonggu.community.global.security;

/**
 * Access / Refresh 를 토큰 클레임에 명시해 서로 바꿔치기해 쓰는 것을 막는다.
 * (Refresh Token 으로 일반 API 를 호출하거나, Access Token 으로 재발급을 시도하는 경우 차단)
 */
public enum TokenType {
	ACCESS,
	REFRESH
}
