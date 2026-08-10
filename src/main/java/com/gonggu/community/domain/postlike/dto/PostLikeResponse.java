package com.gonggu.community.domain.postlike.dto;

/**
 * 추천 버튼 응답. 갱신된 추천수를 함께 내려 프론트가 다시 조회하지 않아도 숫자를 반영할 수 있게 한다.
 */
public record PostLikeResponse(
	Long postId,
	boolean liked,
	int likeCount
) {
}
