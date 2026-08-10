package com.gonggu.community.domain.post;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.gonggu.community.domain.post.dto.PostCreateRequest;
import com.gonggu.community.domain.post.dto.PostDetailResponse;
import com.gonggu.community.domain.post.dto.PostFeedResponse;
import com.gonggu.community.domain.post.dto.PostSearchCondition;
import com.gonggu.community.domain.post.dto.PostUpdateRequest;
import com.gonggu.community.global.common.ApiResponse;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.security.AuthUtils;
import com.gonggu.community.global.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

	private final PostService postService;

	/**
	 * 메인 페이지 피드 겸 검색 API.
	 *
	 * keyword / categoryId / status 는 서로 조합해서 AND 로 걸 수 있다.
	 * 무한 스크롤용이라 한 번에 최대 15개(PostService.MAX_PAGE_SIZE)까지만 내려가고,
	 * 응답의 hasNext / nextPage 로 다음 페이지를 이어서 요청한다.
	 *
	 * 비로그인 사용자도 볼 수 있어야 하므로 principal 이 null 이어도 동작하며,
	 * 이때 liked/saved/followingAuthor 는 모두 false 로 내려간다.
	 */
	@GetMapping("/posts")
	public ApiResponse<PageResponse<PostFeedResponse>> getPosts(
		@RequestParam(required = false) PostType postType,
		@RequestParam(required = false) Integer categoryId,
		@RequestParam(required = false) PostStatusFilter status,
		@RequestParam(required = false) String keyword,
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = PostService.MAX_PAGE_SIZE, sort = "id", direction = Sort.Direction.DESC)
		Pageable pageable) {

		PostSearchCondition condition = new PostSearchCondition(postType, categoryId, status, keyword);
		return ApiResponse.success(
			postService.search(condition, AuthUtils.optionalUserId(principal), pageable));
	}

	@GetMapping("/posts/{postId}")
	public ApiResponse<PostDetailResponse> getPost(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		return ApiResponse.success(postService.getDetail(postId, AuthUtils.optionalUserId(principal)));
	}

	@PostMapping("/posts")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<PostDetailResponse> createPost(@AuthenticationPrincipal CustomUserDetails principal,
		@Valid @RequestBody PostCreateRequest request) {
		return ApiResponse.success(postService.create(AuthUtils.requireUserId(principal), request));
	}

	@PutMapping("/posts/{postId}")
	public ApiResponse<PostDetailResponse> updatePost(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal,
		@Valid @RequestBody PostUpdateRequest request) {
		return ApiResponse.success(postService.update(AuthUtils.requireUserId(principal), postId, request));
	}

	@DeleteMapping("/posts/{postId}")
	public ApiResponse<Void> deletePost(@PathVariable Long postId,
		@AuthenticationPrincipal CustomUserDetails principal) {
		postService.delete(AuthUtils.requireUserId(principal), postId);
		return ApiResponse.success();
	}

	/** 마이페이지 / 다른 사람 프로필의 게시물 리스트 (피드와 같은 카드 형태) */
	@GetMapping("/users/{userId}/posts")
	public ApiResponse<PageResponse<PostFeedResponse>> getUserPosts(@PathVariable Long userId,
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = PostService.MAX_PAGE_SIZE) Pageable pageable) {
		return ApiResponse.success(
			postService.getPostsByUser(userId, AuthUtils.optionalUserId(principal), pageable));
	}

	@GetMapping("/users/me/posts")
	public ApiResponse<PageResponse<PostFeedResponse>> getMyPosts(
		@AuthenticationPrincipal CustomUserDetails principal,
		@PageableDefault(size = PostService.MAX_PAGE_SIZE) Pageable pageable) {
		Long userId = AuthUtils.requireUserId(principal);
		return ApiResponse.success(postService.getPostsByUser(userId, userId, pageable));
	}
}
