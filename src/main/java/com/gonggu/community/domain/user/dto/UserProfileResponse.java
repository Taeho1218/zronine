package com.gonggu.community.domain.user.dto;

import java.time.LocalDateTime;

import com.gonggu.community.domain.user.User;

/**
 * 마이 프로필 / 다른 사람 프로필 화면에 필요한 정보.
 * following 은 "조회자가 이 사람을 팔로우 중인지" 이며, 비로그인 조회나 본인 프로필일 때는 false 로 내려간다.
 * (본인 프로필에서는 프론트가 me=true 를 보고 팔로우 버튼 자체를 감춘다)
 */
public record UserProfileResponse(
	Long userId,
	String email,
	String nickname,
	String profileImageUrl,
	long followerCount,
	long followingCount,
	long postCount,
	LocalDateTime joinedAt,
	boolean following,
	boolean me
) {

	public static UserProfileResponse of(User user, long followerCount, long followingCount, long postCount,
		boolean following, boolean me) {
		return new UserProfileResponse(
			user.getId(),
			// 이메일은 로그인 아이디라 남에게 노출하지 않고 본인 조회일 때만 담는다.
			me ? user.getEmail() : null,
			user.getNickname(),
			user.getProfileImageUrl(),
			followerCount,
			followingCount,
			postCount,
			user.getCreatedAt(),
			following,
			me
		);
	}
}
