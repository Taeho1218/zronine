package com.gonggu.community.domain.follow.dto;

/**
 * 팔로우 버튼을 누른 직후 프론트가 버튼 상태와 팔로워 수를 함께 갱신할 수 있도록
 * 결과 상태와 최신 팔로워 수를 같이 돌려준다.
 */
public record FollowResponse(
	Long targetUserId,
	boolean following,
	long followerCount
) {
}
