package com.gonggu.community.domain.postsave;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostService;
import com.gonggu.community.domain.post.dto.PostFeedResponse;
import com.gonggu.community.domain.postsave.dto.PostSaveResponse;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserService;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostSaveService {

	private final PostSaveRepository postSaveRepository;
	private final PostService postService;
	private final UserService userService;

	/**
	 * (user_id, post_id) UNIQUE 로 중복 저장이 막혀 있다.
	 * 제약 위반이 그대로 올라가면 500 이 되므로 사전 조회로 409 를 주고,
	 * 동시 요청으로 조회를 통과한 경우를 대비해 제약 위반도 같은 응답으로 변환한다.
	 */
	@Transactional
	public PostSaveResponse save(Long userId, Long postId) {
		Post post = postService.getPostOrThrow(postId);
		User user = userService.getUserOrThrow(userId);

		if (postSaveRepository.existsByUserIdAndPostId(userId, postId)) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_SAVED);
		}
		try {
			postSaveRepository.saveAndFlush(new PostSave(user, post));
		} catch (DataIntegrityViolationException e) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_SAVED);
		}

		return new PostSaveResponse(postId, true);
	}

	@Transactional
	public PostSaveResponse cancel(Long userId, Long postId) {
		PostSave postSave = postSaveRepository.findByUserIdAndPostId(userId, postId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.SAVE_NOT_FOUND));

		postSaveRepository.delete(postSave);

		return new PostSaveResponse(postId, false);
	}

	/**
	 * 마이페이지 저장목록. 화면상 마이페이지 게시물 리스트와 같은 카드 형태라
	 * 피드 응답(PostFeedResponse)을 그대로 재사용한다.
	 */
	public PageResponse<PostFeedResponse> getMySaves(Long userId, Pageable pageable) {
		return postService.toFeedPage(
			postSaveRepository.findByUserIdOrderByIdDesc(userId, pageable).map(PostSave::getPost),
			userId,
			LocalDateTime.now()
		);
	}
}
