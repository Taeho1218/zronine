package com.gonggu.community.global.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

	private final String secret;

	/** Access Token 은 탈취 시 피해를 줄이기 위해 짧게(기본 1시간) 가져간다. */
	private final long accessTokenValiditySeconds;

	/** Refresh Token 은 재발급 전용으로만 쓰이며 만료가 길다(기본 14일). */
	private final long refreshTokenValiditySeconds;
}
