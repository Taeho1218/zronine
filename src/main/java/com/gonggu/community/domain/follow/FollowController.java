package com.gonggu.community.domain.follow;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.follow.dto.FollowResponse;
import com.gonggu.community.domain.follow.dto.FollowUserResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/{userId}")
@RequiredArgsConstructor
public class FollowController {

	private final FollowService followService;

	@PostMapping("/follow")
	public ApiResponse<FollowResponse> follow(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(followService.follow(AuthUtils.requireUserId(principal), userId));
	}

	@DeleteMapping("/follow")
	public ApiResponse<FollowResponse> unfollow(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(followService.unfollow(AuthUtils.requireUserId(principal), userId));
	}

	@GetMapping("/followers")
	public ApiResponse<PageResponse<FollowUserResponse>> getFollowers(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = 20) Pageable pageable) {
		return ApiResponse.success(
			followService.getFollowers(userId, AuthUtils.optionalUserId(principal), pageable));
	}

	@GetMapping("/followings")
	public ApiResponse<PageResponse<FollowUserResponse>> getFollowings(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = 20) Pageable pageable) {
		return ApiResponse.success(
			followService.getFollowings(userId, AuthUtils.optionalUserId(principal), pageable));
	}
}
