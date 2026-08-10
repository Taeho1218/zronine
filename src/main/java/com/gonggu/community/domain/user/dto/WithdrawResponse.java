package com.gonggu.community.domain.user.dto;

import java.time.LocalDateTime;

/**
 * 탈퇴 확인 화면에서 "30일간 임시 보관됩니다" 안내를 그리기 위해
 * 실제 삭제 예정일을 계산해 함께 내려준다.
 */
public record WithdrawResponse(
	LocalDateTime deletedAt,
	LocalDateTime purgeScheduledAt,
	int retentionDays
) {
}
