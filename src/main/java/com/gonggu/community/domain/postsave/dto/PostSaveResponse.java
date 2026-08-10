package com.gonggu.community.domain.postsave.dto;

/**
 * 저장 버튼을 누른 직후 프론트가 버튼 상태만 토글하면 되도록 결과 상태를 돌려준다.
 */
public record PostSaveResponse(
	Long postId,
	boolean saved
) {
}
