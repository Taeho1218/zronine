package com.gonggu.community.domain.post;

import java.time.LocalDateTime;

/**
 * 응답에 실어주는 셀러글의 모집 진행 상태.
 * 프론트가 start_date/end_date 와 현재 시각을 직접 비교하면 클라이언트 시계에 따라 결과가 달라지므로
 * 서버 시각 기준으로 계산해 내려준다.
 */
public enum PostProgress {
	/** 모집 시작 전 */
	UPCOMING,
	/** 모집 진행중 */
	ONGOING,
	/** 모집 종료 */
	ENDED,
	/** 일반글처럼 모집 기간 개념이 없는 경우 */
	NONE;

	public static PostProgress of(Post post, LocalDateTime now) {
		if (!post.isSeller() || post.getStartDate() == null || post.getEndDate() == null) {
			return NONE;
		}
		if (now.isBefore(post.getStartDate())) {
			return UPCOMING;
		}
		if (now.isAfter(post.getEndDate())) {
			return ENDED;
		}
		return ONGOING;
	}
}
