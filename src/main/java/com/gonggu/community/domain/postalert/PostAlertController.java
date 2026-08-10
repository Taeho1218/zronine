package com.gonggu.community.domain.postalert;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.postalert.dto.AlertHistoryResponse;
import com.gonggu.community.domain.postalert.dto.PostAlertResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostAlertController {

	private final PostAlertService postAlertService;

	@PostMapping("/posts/{postId}/alert")
	public ApiResponse<PostAlertResponse> register(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postAlertService.register(AuthUtils.requireUserId(principal), postId));
	}

	@DeleteMapping("/posts/{postId}/alert")
	public ApiResponse<PostAlertResponse> cancel(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postAlertService.cancel(AuthUtils.requireUserId(principal), postId));
	}

	/** 마이페이지 알람 내역 */
	@GetMapping("/users/me/alerts")
	public ApiResponse<PageResponse<AlertHistoryResponse>> getMyAlerts(
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = 20) Pageable pageable) {
		return ApiResponse.success(postAlertService.getMyAlerts(AuthUtils.requireUserId(principal), pageable));
	}
}
