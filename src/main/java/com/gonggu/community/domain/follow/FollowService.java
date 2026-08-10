package com.gonggu.community.domain.follow;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.follow.dto.FollowResponse;
import com.gonggu.community.domain.follow.dto.FollowUserResponse;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserRepository;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

	private final FollowRepository followRepository;
	private final UserRepository userRepository;

	/**
	 * 중복 팔로우는 (follower_id, following_id) UNIQUE 제약으로도 막히지만,
	 * 제약 위반 예외는 500 으로 새어나가므로 사전 조회로 409 를 명시적으로 던진다.
	 * 그럼에도 동시 요청이 겹칠 수 있어 제약 위반도 함께 잡아 같은 응답으로 변환한다.
	 */
	@Transactional
	public FollowResponse follow(Long followerId, Long targetUserId) {
		if (followerId.equals(targetUserId)) {
			throw new InvalidRequestException(ErrorCode.CANNOT_FOLLOW_SELF);
		}

		User follower = getUserOrThrow(followerId);
		User target = getUserOrThrow(targetUserId);

		if (followRepository.existsByFollowerIdAndFollowingId(followerId, targetUserId)) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_FOLLOWING);
		}
		try {
			followRepository.saveAndFlush(new Follow(follower, target));
		} catch (DataIntegrityViolationException e) {
			throw new DuplicateResourceException(ErrorCode.ALREADY_FOLLOWING);
		}

		return new FollowResponse(targetUserId, true, followRepository.countByFollowingId(targetUserId));
	}

	@Transactional
	public FollowResponse unfollow(Long followerId, Long targetUserId) {
		Follow follow = followRepository.findByFollowerIdAndFollowingId(followerId, targetUserId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.FOLLOW_NOT_FOUND));

		// 삭제를 먼저 반영해야 뒤이은 count 가 취소 결과를 반영한 값이 된다.
		followRepository.delete(follow);
		followRepository.flush();

		return new FollowResponse(targetUserId, false, followRepository.countByFollowingId(targetUserId));
	}

	/** 특정 회원을 팔로우하는 사람들 */
	public PageResponse<FollowUserResponse> getFollowers(Long targetUserId, Long viewerId, Pageable pageable) {
		getUserOrThrow(targetUserId);
		Page<Follow> page = followRepository.findByFollowingIdOrderByIdDesc(targetUserId, pageable);
		return toResponse(page, viewerId, true);
	}

	/** 특정 회원이 팔로우하는 사람들 */
	public PageResponse<FollowUserResponse> getFollowings(Long targetUserId, Long viewerId, Pageable pageable) {
		getUserOrThrow(targetUserId);
		Page<Follow> page = followRepository.findByFollowerIdOrderByIdDesc(targetUserId, pageable);
		return toResponse(page, viewerId, false);
	}

	private PageResponse<FollowUserResponse> toResponse(Page<Follow> page, Long viewerId, boolean pickFollower) {
		List<User> users = page.getContent().stream()
			.map(follow -> pickFollower ? follow.getFollower() : follow.getFollowing())
			.toList();

		Set<Long> followingIds = findFollowingIds(viewerId, users.stream().map(User::getId).toList());

		return PageResponse.from(page, follow -> {
			User user = pickFollower ? follow.getFollower() : follow.getFollowing();
			return FollowUserResponse.of(user, followingIds.contains(user.getId()));
		});
	}

	/**
	 * 목록에 나온 사람마다 팔로우 여부를 개별 조회하면 N+1 이 되므로
	 * 한 번의 IN 조회로 "내가 팔로우 중인 id 집합"을 만들어 재사용한다.
	 */
	public Set<Long> findFollowingIds(Long viewerId, Collection<Long> targetUserIds) {
		if (viewerId == null || targetUserIds == null || targetUserIds.isEmpty()) {
			return Set.of();
		}
		return Set.copyOf(followRepository.findFollowingIdsIn(viewerId, targetUserIds));
	}

	private User getUserOrThrow(Long userId) {
		return userRepository.findById(userId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
	}
}
