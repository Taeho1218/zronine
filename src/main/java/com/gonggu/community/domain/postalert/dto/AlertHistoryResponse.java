package com.gonggu.community.domain.postalert.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostProgress;
import com.gonggu.community.domain.postalert.PostAlert;

/**
 * 마이페이지 "알람 내역" 한 줄.
 * 이 화면은 사진 / 물건이름 / 모집기간 / 구매하러가기 버튼만 필요해서
 * 게시글 전체를 내려주는 피드 응답 대신 필요한 필드만 담은 전용 응답을 쓴다.
 * buyUrl 이 "구매하러가기" 버튼의 이동 대상이다.
 */
public record AlertHistoryResponse(
	Long alertId,
	Long postId,
	String title,
	String thumbnailUrl,
	String productName,
	LocalDateTime startDate,
	LocalDateTime endDate,
	PostProgress progress,
	String buyUrl,
	LocalDateTime alertedAt
) {

	public static AlertHistoryResponse of(PostAlert alert, LocalDateTime now) {
		Post post = alert.getPost();
		List<String> imageUrls = post.getImageUrls() == null ? List.of() : post.getImageUrls();

		return new AlertHistoryResponse(
			alert.getId(),
			post.getId(),
			post.getTitle(),
			imageUrls.isEmpty() ? null : imageUrls.get(0),
			post.getProductName(),
			post.getStartDate(),
			post.getEndDate(),
			PostProgress.of(post, now),
			post.getBuyUrl(),
			alert.getCreatedAt()
		);
	}
}
