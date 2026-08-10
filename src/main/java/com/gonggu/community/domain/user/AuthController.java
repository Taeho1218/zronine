package com.gonggu.community.domain.user;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.user.dto.AuthResult;
import com.gonggu.community.domain.user.dto.LoginRequest;
import com.gonggu.community.domain.user.dto.SignUpRequest;
import com.gonggu.community.domain.user.dto.TokenResponse;
import com.gonggu.community.domain.user.dto.UserSummaryResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.UnauthorizedException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 회원가입/로그인/토큰 재발급처럼 인증 전에 호출되는 엔드포인트를 모아둔다.
 * (SecurityConfig 에서 /api/auth/** 는 permitAll 로 열려 있다)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	/**
	 * Refresh Token 을 담는 쿠키 이름.
	 * httpOnly 라 자바스크립트(document.cookie)로는 절대 읽거나 지울 수 없고,
	 * 브라우저가 /api/auth/** 요청에만 자동으로 실어 보낸다(아래 path 제한과 짝을 이룸).
	 */
	private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

	private final UserService userService;

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<UserSummaryResponse> signUp(@Valid @RequestBody SignUpRequest request) {
		return ApiResponse.success(userService.signUp(request), "회원가입이 완료되었습니다.");
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
		return withRefreshCookie(userService.login(request));
	}

	/**
	 * Refresh Token 은 요청 바디가 아니라 httpOnly 쿠키에서 읽는다.
	 * 쿠키가 아예 없으면(만료돼서 브라우저가 지웠거나, 애초에 로그인한 적 없는 경우) 재발급도 로그인 필요로 처리한다.
	 */
	@PostMapping("/reissue")
	public ResponseEntity<ApiResponse<TokenResponse>> reissue(
		@CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
		if (refreshToken == null) {
			throw new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN);
		}
		return withRefreshCookie(userService.reissue(refreshToken));
	}

	/**
	 * 서버가 토큰을 저장하지 않는 무상태 구조라 Access Token 쪽은 클라이언트가 메모리에서 버리면 끝이다.
	 * 다만 Refresh Token 쿠키는 httpOnly라 자바스크립트로 못 지우므로,
	 * 같은 이름의 쿠키를 만료 처리(maxAge=0)해서 브라우저가 즉시 폐기하도록 응답한다.
	 */
	@PostMapping("/logout")
	public ResponseEntity<ApiResponse<Void>> logout() {
		ResponseCookie expiredCookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
			.httpOnly(true)
			.secure(true)
			.sameSite("None")
			.path("/api/auth")
			.maxAge(0)
			.build();

		return ResponseEntity.ok()
			.header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
			.body(ApiResponse.success());
	}

	/**
	 * 로그인/재발급 응답에 공통으로 Refresh Token 쿠키를 실어 보낸다.
	 *
	 * - httpOnly: 자바스크립트가 읽을 수 없어 XSS 로 탈취되지 않는다.
	 * - secure: HTTPS 로만 전송된다. (Chrome/Firefox 는 localhost 를 신뢰 가능한 출처로 취급해
	 *   로컬 개발 환경에서도 http://localhost 로 정상 동작한다)
	 * - sameSite=None: 프론트(다른 도메인)와 백엔드가 cross-site 로 통신하므로 필수이며,
	 *   None 은 반드시 secure 와 함께 써야 브라우저가 쿠키를 실어 보낸다.
	 * - path=/api/auth: 모든 요청에 매번 딸려나가지 않고 재발급/로그아웃 호출에만 쓰이도록 범위를 좁힌다.
	 */
	private ResponseEntity<ApiResponse<TokenResponse>> withRefreshCookie(AuthResult result) {
		ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, result.refreshToken())
			.httpOnly(true)
			.secure(true)
			.sameSite("None")
			.path("/api/auth")
			.maxAge(result.refreshTokenValiditySeconds())
			.build();

		return ResponseEntity.ok()
			.header(HttpHeaders.SET_COOKIE, cookie.toString())
			.body(ApiResponse.success(result.body()));
	}
}
