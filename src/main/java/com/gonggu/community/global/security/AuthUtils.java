package com.gonggu.community.global.security;

import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.UnauthorizedException;

/**
 * 목록/상세 API 는 비로그인 사용자도 호출할 수 있어 principal 이 null 로 들어온다.
 * "로그인했으면 userId, 아니면 null" 과 "반드시 로그인 필요"를 구분해서 쓰기 위한 헬퍼.
 */
public final class AuthUtils {

	private AuthUtils() {
	}

	public static Long requireUserId(CustomUserDetails principal) {
		if (principal == null) {
			throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
		}
		return principal.getUserId();
	}

	public static Long optionalUserId(CustomUserDetails principal) {
		return principal == null ? null : principal.getUserId();
	}
}
