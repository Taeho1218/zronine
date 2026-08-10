package com.gonggu.community.domain.postlike;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.postlike.dto.PostLikeResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts/{postId}/like")
@RequiredArgsConstructor
public class PostLikeController {

	private final PostLikeService postLikeService;

	@PostMapping
	public ApiResponse<PostLikeResponse> like(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postLikeService.like(AuthUtils.requireUserId(principal), postId));
	}

	@DeleteMapping
	public ApiResponse<PostLikeResponse> cancel(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postLikeService.cancel(AuthUtils.requireUserId(principal), postId));
	}
}
