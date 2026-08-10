package com.gonggu.community.domain.postalert.dto;

/**
 * 알림받기 버튼 응답.
 */
public record PostAlertResponse(
	Long postId,
	boolean alerted
) {
}
