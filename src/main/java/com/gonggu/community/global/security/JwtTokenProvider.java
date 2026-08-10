package com.gonggu.community.global.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.UnauthorizedException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

/**
 * JWT 발급/검증 전담 컴포넌트.
 * subject 에는 이메일 대신 userId 를 넣는다. 이메일은 바뀔 수 있지만 PK 는 불변이라
 * 토큰 유효기간 중 식별자가 흔들리지 않기 때문이다.
 */
@Slf4j
@Component
public class JwtTokenProvider {

	private static final String CLAIM_TOKEN_TYPE = "type";
	private static final String CLAIM_EMAIL = "email";
	private static final String AUTHORIZATION_HEADER = "Authorization";
	private static final String BEARER_PREFIX = "Bearer ";

	private final SecretKey secretKey;
	private final long accessTokenValiditySeconds;
	private final long refreshTokenValiditySeconds;

	public JwtTokenProvider(JwtProperties jwtProperties) {
		byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
		// HS256 은 최소 256bit(32byte) 키를 요구한다. 짧은 시크릿이 설정되면 기동 시점에 바로 실패시켜
		// 운영에서 약한 키로 서명되는 상황을 막는다.
		if (keyBytes.length < 32) {
			throw new IllegalStateException("jwt.secret 은 최소 32바이트 이상이어야 합니다.");
		}
		this.secretKey = Keys.hmacShaKeyFor(keyBytes);
		this.accessTokenValiditySeconds = jwtProperties.getAccessTokenValiditySeconds();
		this.refreshTokenValiditySeconds = jwtProperties.getRefreshTokenValiditySeconds();
	}

	public String createAccessToken(Long userId, String email) {
		return createToken(userId, email, TokenType.ACCESS, accessTokenValiditySeconds);
	}

	public String createRefreshToken(Long userId, String email) {
		return createToken(userId, email, TokenType.REFRESH, refreshTokenValiditySeconds);
	}

	public long getAccessTokenValiditySeconds() {
		return accessTokenValiditySeconds;
	}

	private String createToken(Long userId, String email, TokenType tokenType, long validitySeconds) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + validitySeconds * 1000L);

		return Jwts.builder()
			.subject(String.valueOf(userId))
			.claim(CLAIM_EMAIL, email)
			.claim(CLAIM_TOKEN_TYPE, tokenType.name())
			.issuedAt(now)
			.expiration(expiry)
			.signWith(secretKey)
			.compact();
	}

	/**
	 * 필터에서는 예외를 던지지 않고 boolean 으로만 판단해야 익명 요청 흐름이 끊기지 않는다.
	 */
	public boolean isValid(String token, TokenType expectedType) {
		try {
			Claims claims = parseClaims(token);
			return expectedType.name().equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
		} catch (ExpiredJwtException e) {
			log.debug("만료된 토큰: {}", e.getMessage());
			return false;
		} catch (JwtException | IllegalArgumentException e) {
			log.debug("유효하지 않은 토큰: {}", e.getMessage());
			return false;
		}
	}

	/**
	 * 재발급 API 처럼 실패 사유를 클라이언트에 알려야 하는 곳에서 쓴다.
	 * (만료됐는지 위조인지에 따라 프론트가 재로그인 유도 여부를 결정할 수 있어야 함)
	 */
	public Long parseUserIdOrThrow(String token, TokenType expectedType) {
		Claims claims;
		try {
			claims = parseClaims(token);
		} catch (ExpiredJwtException e) {
			throw new UnauthorizedException(ErrorCode.EXPIRED_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
		}
		if (!expectedType.name().equals(claims.get(CLAIM_TOKEN_TYPE, String.class))) {
			throw new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN);
		}
		return Long.valueOf(claims.getSubject());
	}

	public Long getUserId(String token) {
		return Long.valueOf(parseClaims(token).getSubject());
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}

	public String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
		if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
			return bearerToken.substring(BEARER_PREFIX.length()).trim();
		}
		return null;
	}
}
