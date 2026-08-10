package com.gonggu.community.domain.comment;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.comment.dto.CommentCreateRequest;
import com.gonggu.community.domain.comment.dto.CommentResponse;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

	private final CommentService commentService;

	/**
	 * 댓글 목록은 비로그인 사용자도 볼 수 있다.
	 * 다만 비밀댓글 내용은 권한이 있는 사람에게만 내려가므로 principal 을 함께 넘긴다.
	 */
	@GetMapping("/posts/{postId}/comments")
	public ApiResponse<List<CommentResponse>> getComments(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(commentService.getComments(postId, AuthUtils.optionalUserId(principal)));
	}

	@PostMapping("/posts/{postId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<CommentResponse> createComment(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal,
		@Valid @RequestBody CommentCreateRequest request) {
		return ApiResponse.success(commentService.create(AuthUtils.requireUserId(principal), postId, request));
	}

	@DeleteMapping("/comments/{commentId}")
	public ApiResponse<Void> deleteComment(@PathVariable Long commentId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		commentService.delete(AuthUtils.requireUserId(principal), commentId);
		return ApiResponse.success();
	}
}
