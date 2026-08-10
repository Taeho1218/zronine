package com.gonggu.community.domain.post.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.gonggu.community.domain.category.dto.CategoryResponse;
import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostProgress;
import com.gonggu.community.domain.post.PostType;
import com.gonggu.community.domain.user.dto.UserSummaryResponse;

/**
 * 게시글 상세 페이지 응답.
 *
 * 셀러글과 일반글이 같은 스키마를 공유한다. 일반글이면 셀러 전용 필드가 전부 null 로 내려가고,
 * 프론트는 postType 을 보고 그릴 영역을 결정한다.
 * eventNote 는 "없으면 빈칸"이라는 화면 요구가 있어 null 을 그대로 전달한다.
 * alerted 는 셀러글에서만 의미가 있고 일반글에서는 항상 false 다.
 */
public record PostDetailResponse(
	Long postId,
	PostType postType,
	UserSummaryResponse author,
	String title,
	String content,
	List<String> imageUrls,
	String productName,
	BigDecimal price,
	String buyUrl,
	LocalDateTime startDate,
	LocalDateTime endDate,
	String eventNote,
	PostProgress progress,
	List<CategoryResponse> categories,
	int likeCount,
	int commentCount,
	boolean liked,
	boolean saved,
	boolean alerted,
	boolean followingAuthor,
	boolean mine,
	LocalDateTime createdAt
) {

	public static PostDetailResponse of(Post post, List<CategoryResponse> categories, LocalDateTime now,
		boolean liked, boolean saved, boolean alerted, boolean followingAuthor, Long viewerId) {

		return new PostDetailResponse(
			post.getId(),
			post.getPostType(),
			UserSummaryResponse.from(post.getUser()),
			post.getTitle(),
			post.getContent(),
			post.getImageUrls() == null ? List.of() : post.getImageUrls(),
			post.getProductName(),
			post.getPrice(),
			post.getBuyUrl(),
			post.getStartDate(),
			post.getEndDate(),
			post.getEventNote(),
			PostProgress.of(post, now),
			categories,
			post.getLikeCount(),
			post.getCommentCount(),
			liked,
			saved,
			alerted,
			followingAuthor,
			viewerId != null && post.isOwnedBy(viewerId),
			post.getCreatedAt()
		);
	}
}
