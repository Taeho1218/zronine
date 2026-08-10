package com.gonggu.community.domain.user.dto;

import com.gonggu.community.domain.user.User;

/**
 * 게시글 작성자, 댓글 작성자, 팔로워 목록 등 "사람 한 줄"을 그릴 때 공통으로 쓰는 최소 정보.
 */
public record UserSummaryResponse(
	Long userId,
	String nickname,
	String profileImageUrl
) {

	public static UserSummaryResponse from(User user) {
		return new UserSummaryResponse(user.getId(), user.getNickname(), user.getProfileImageUrl());
	}
}
