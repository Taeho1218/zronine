package com.gonggu.community.domain.follow.dto;

import com.gonggu.community.domain.user.User;

/**
 * 팔로워/팔로잉 목록의 한 줄.
 * following 은 "목록을 보고 있는 사람이 이 사람을 팔로우 중인지"라서,
 * 팔로워 목록에서도 맞팔 여부에 따라 버튼 상태를 다르게 그릴 수 있다.
 */
public record FollowUserResponse(
	Long userId,
	String nickname,
	String profileImageUrl,
	boolean following
) {

	public static FollowUserResponse of(User user, boolean following) {
		return new FollowUserResponse(user.getId(), user.getNickname(), user.getProfileImageUrl(), following);
	}
}
