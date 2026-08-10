package com.gonggu.community.domain.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.user.dto.NicknameCheckResponse;
import com.gonggu.community.domain.user.dto.UserProfileResponse;
import com.gonggu.community.domain.user.dto.UserUpdateRequest;
import com.gonggu.community.domain.user.dto.WithdrawResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/check-email")
	public ApiResponse<NicknameCheckResponse> checkEmail(@RequestParam String email) {
		return ApiResponse.success(userService.checkEmailAvailable(email));
	}

	@GetMapping("/check-nickname")
	public ApiResponse<NicknameCheckResponse> checkNickname(@RequestParam String nickname) {
		return ApiResponse.success(userService.checkNicknameAvailable(nickname));
	}

	@GetMapping("/me")
	public ApiResponse<UserProfileResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails principal) {
		Long userId = AuthUtils.requireUserId(principal);
		return ApiResponse.success(userService.getProfile(userId, userId));
	}

	/**
	 * 다른 사람 프로필도 같은 응답을 쓴다.
	 * 비로그인 조회가 가능하므로 principal 이 null 이어도 동작해야 하고, 이때 following 은 항상 false 다.
	 */
	@GetMapping("/{userId}")
	public ApiResponse<UserProfileResponse> getProfile(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(userService.getProfile(userId, AuthUtils.optionalUserId(principal)));
	}

	@PatchMapping("/me")
	public ApiResponse<UserProfileResponse> updateMyProfile(@AuthenticationPrincipal CustomUserDetails principal,
		@Valid @RequestBody UserUpdateRequest request) {
		return ApiResponse.success(userService.updateProfile(AuthUtils.requireUserId(principal), request));
	}

	/**
	 * 탈퇴 요청. 즉시 삭제가 아니라 30일 임시 보관(Soft Delete)이며,
	 * 응답의 purgeScheduledAt 으로 안내 문구를 그릴 수 있다.
	 */
	@DeleteMapping("/me")
	public ApiResponse<WithdrawResponse> withdraw(@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(
			userService.withdraw(AuthUtils.requireUserId(principal)),
			"탈퇴 신청이 완료되었습니다. 30일 내 재로그인 문의 시 복구할 수 있습니다."
		);
	}
}
