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
 * 메인 페이지 3열 피드 / 마이페이지 게시물 리스트의 카드 한 장.
 *
 * liked / saved / followingAuthor 는 조회하는 사람마다 달라지는 값이라
 * 비로그인 조회에서는 모두 false 로 내려간다.
 * (신고 버튼은 프론트 전용이라 백엔드 응답에 관련 필드가 없다)
 */
public record PostFeedResponse(
	Long postId,
	PostType postType,
	UserSummaryResponse author,
	String title,
	List<String> imageUrls,
	String thumbnailUrl,
	String productName,
	BigDecimal price,
	LocalDateTime startDate,
	LocalDateTime endDate,
	PostProgress progress,
	List<CategoryResponse> categories,
	int likeCount,
	int commentCount,
	boolean liked,
	boolean saved,
	boolean followingAuthor,
	boolean mine,
	LocalDateTime createdAt
) {

	public static PostFeedResponse of(Post post, List<CategoryResponse> categories, LocalDateTime now,
		boolean liked, boolean saved, boolean followingAuthor, Long viewerId) {

		List<String> imageUrls = post.getImageUrls() == null ? List.of() : post.getImageUrls();

		return new PostFeedResponse(
			post.getId(),
			post.getPostType(),
			UserSummaryResponse.from(post.getUser()),
			post.getTitle(),
			imageUrls,
			imageUrls.isEmpty() ? null : imageUrls.get(0),
			post.getProductName(),
			post.getPrice(),
			post.getStartDate(),
			post.getEndDate(),
			PostProgress.of(post, now),
			categories,
			post.getLikeCount(),
			post.getCommentCount(),
			liked,
			saved,
			followingAuthor,
			viewerId != null && post.isOwnedBy(viewerId),
			post.getCreatedAt()
		);
	}
}
