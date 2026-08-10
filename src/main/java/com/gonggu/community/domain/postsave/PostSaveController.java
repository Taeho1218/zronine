package com.gonggu.community.domain.postsave;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.post.dto.PostFeedResponse;
import com.gonggu.community.domain.postsave.dto.PostSaveResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostSaveController {

	private final PostSaveService postSaveService;

	@PostMapping("/posts/{postId}/save")
	public ApiResponse<PostSaveResponse> save(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postSaveService.save(AuthUtils.requireUserId(principal), postId));
	}

	@DeleteMapping("/posts/{postId}/save")
	public ApiResponse<PostSaveResponse> cancel(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postSaveService.cancel(AuthUtils.requireUserId(principal), postId));
	}

	/** 마이페이지 저장목록 */
	@GetMapping("/users/me/saves")
	public ApiResponse<PageResponse<PostFeedResponse>> getMySaves(
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = 12) Pageable pageable) {
		return ApiResponse.success(postSaveService.getMySaves(AuthUtils.requireUserId(principal), pageable));
	}
}
