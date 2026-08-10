package com.gonggu.community.domain.postlike;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostService;
import com.gonggu.community.domain.postlike.dto.PostLikeResponse;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserService;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostLikeService {

	private final PostLikeRepository postLikeRepository;
	private final PostService postService;
	private final UserService userService;

	/**
	 * post_likes 행 추가와 posts.like_count 증가를 한 트랜잭션에서 처리한다.
	 * 둘이 따로 커밋되면 "내가 눌렀는데 숫자는 그대로"인 상태가 남기 때문이다.
	 * 중복 추천은 (user_id, post_id) UNIQUE 로 막히지만, 카운터가 두 번 오르는 일이 없도록
	 * 저장 전에 존재 여부를 확인하고 제약 위반도 같은 에러로 변환한다.
	 */
	@Transactional
	public PostLikeResponse like(Long userId, Long postId) {
		Post post = postService.getPostOrThrow(postId);
		User user = userService.getUserOrThrow(userId);

		if (postLikeRepository.existsByUserIdAndPostId(userId, postId)) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_LIKED);
		}
		try {
			postLikeRepository.saveAndFlush(new PostLike(user, post));
		} catch (DataIntegrityViolationException e) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_LIKED);
		}
		post.increaseLikeCount();

		return new PostLikeResponse(postId, true, post.getLikeCount());
	}

	@Transactional
	public PostLikeResponse cancel(Long userId, Long postId) {
		PostLike postLike = postLikeRepository.findByUserIdAndPostId(userId, postId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.LIKE_NOT_FOUND));

		Post post = postLike.getPost();
		postLikeRepository.delete(postLike);
		post.decreaseLikeCount();

		return new PostLikeResponse(postId, false, post.getLikeCount());
	}
}
