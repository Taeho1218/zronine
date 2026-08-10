package com.gonggu.community.domain.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.user.dto.LoginRequest;
import com.gonggu.community.domain.user.dto.SignUpRequest;
import com.gonggu.community.domain.user.dto.TokenReissueRequest;
import com.gonggu.community.domain.user.dto.TokenResponse;
import com.gonggu.community.domain.user.dto.UserSummaryResponse;
import com.gonggu.community.global.common.ApiResponse;

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

	private final UserService userService;

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<UserSummaryResponse> signUp(@Valid @RequestBody SignUpRequest request) {
		return ApiResponse.success(userService.signUp(request), "회원가입이 완료되었습니다.");
	}

	@PostMapping("/login")
	public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
		return ApiResponse.success(userService.login(request));
	}

	@PostMapping("/reissue")
	public ApiResponse<TokenResponse> reissue(@Valid @RequestBody TokenReissueRequest request) {
		return ApiResponse.success(userService.reissue(request));
	}

	/**
	 * 서버가 토큰을 저장하지 않는 무상태 구조라 로그아웃은 클라이언트가 토큰을 버리면 끝난다.
	 * 프론트가 호출할 자리를 남겨두기 위한 엔드포인트다.
	 */
	@PostMapping("/logout")
	public ApiResponse<Void> logout() {
		return ApiResponse.success();
	}
}
