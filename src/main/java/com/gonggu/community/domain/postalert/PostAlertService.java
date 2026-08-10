package com.gonggu.community.domain.postalert;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostService;
import com.gonggu.community.domain.postalert.dto.AlertHistoryResponse;
import com.gonggu.community.domain.postalert.dto.PostAlertResponse;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserService;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostAlertService {

	private final PostAlertRepository postAlertRepository;
	private final PostService postService;
	private final UserService userService;

	/**
	 * 알림받기는 모집 기간이 있는 셀러글에만 의미가 있다.
	 * post_alerts 테이블은 일반글도 참조할 수 있는 구조라 DB 가 막아주지 않으므로 여기서 검증한다.
	 *
	 * post_saves / post_likes 와 달리 post_alerts 에는 UNIQUE 제약이 없어
	 * 중복 신청을 막는 책임이 전적으로 이 검사에 있다.
	 */
	@Transactional
	public PostAlertResponse register(Long userId, Long postId) {
		Post post = postService.getPostOrThrow(postId);
		if (!post.isSeller()) {
			throw new InvalidRequestException(ErrorCode.ALERT_ONLY_FOR_SELLER_POST);
		}

		User user = userService.getUserOrThrow(userId);

		if (postAlertRepository.existsByUserIdAndPostId(userId, postId)) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_ALERTED);
		}
		try {
			postAlertRepository.saveAndFlush(new PostAlert(user, post));
		} catch (DataIntegrityViolationException e) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_ALERTED);
		}

		return new PostAlertResponse(postId, true);
	}

	@Transactional
	public PostAlertResponse cancel(Long userId, Long postId) {
		PostAlert alert = postAlertRepository.findByUserIdAndPostId(userId, postId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.ALERT_NOT_FOUND));

		postAlertRepository.delete(alert);

		return new PostAlertResponse(postId, false);
	}

	/** 마이페이지 알람 내역 */
	public PageResponse<AlertHistoryResponse> getMyAlerts(Long userId, Pageable pageable) {
		LocalDateTime now = LocalDateTime.now();
		return PageResponse.from(
			postAlertRepository.findByUserIdOrderByIdDesc(userId, pageable),
			alert -> AlertHistoryResponse.of(alert, now)
		);
	}
}
