package com.gonggu.community.domain.post;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.gonggu.community.domain.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "post_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "post_type", nullable = false)
	private PostType postType;

	@Column(name = "title", nullable = false, length = 255)
	private String title;

	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	/** 사진 여러 장을 별도 테이블 없이 JSON 배열 컬럼 한 개로 관리한다. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "image_urls")
	private List<String> imageUrls;

	@Column(name = "product_name", length = 100)
	private String productName;

	@Column(name = "price", precision = 12, scale = 2)
	private BigDecimal price;

	@Column(name = "buy_url", length = 512)
	private String buyUrl;

	@Column(name = "start_date")
	private LocalDateTime startDate;

	@Column(name = "end_date")
	private LocalDateTime endDate;

	@Column(name = "event_note", length = 255)
	private String eventNote;

	/**
	 * post_likes 를 매번 COUNT 하면 목록 조회마다 조인 집계가 붙는다.
	 * 피드가 3열로 여러 건을 한 번에 그리는 화면이라 비정규화 카운터를 두고
	 * 좋아요 등록/취소 트랜잭션 안에서 함께 증감시킨다.
	 */
	@Column(name = "like_count", nullable = false)
	private int likeCount;

	/** comment_count 도 like_count 와 같은 이유로 비정규화한 카운터다. */
	@Column(name = "comment_count", nullable = false)
	private int commentCount;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Builder
	private Post(User user, PostType postType, String title, String content, List<String> imageUrls,
		String productName, BigDecimal price, String buyUrl, LocalDateTime startDate, LocalDateTime endDate,
		String eventNote) {
		this.user = user;
		this.postType = postType;
		this.title = title;
		this.content = content;
		this.imageUrls = imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls);
		this.productName = productName;
		this.price = price;
		this.buyUrl = buyUrl;
		this.startDate = startDate;
		this.endDate = endDate;
		this.eventNote = eventNote;
		this.likeCount = 0;
		this.commentCount = 0;
	}

	public void update(String title, String content, List<String> imageUrls, String productName, BigDecimal price,
		String buyUrl, LocalDateTime startDate, LocalDateTime endDate, String eventNote) {
		this.title = title;
		this.content = content;
		this.imageUrls = imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls);
		this.productName = productName;
		this.price = price;
		this.buyUrl = buyUrl;
		this.startDate = startDate;
		this.endDate = endDate;
		this.eventNote = eventNote;
	}

	public boolean isSeller() {
		return this.postType == PostType.SELLER;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	/**
	 * 카운터는 동시 요청에서도 음수로 내려가면 안 되므로 하한을 0으로 막는다.
	 * (이미 취소된 좋아요를 중복 취소하는 등의 경합 상황 방어)
	 */
	public void increaseLikeCount() {
		this.likeCount++;
	}

	public void decreaseLikeCount() {
		this.likeCount = Math.max(0, this.likeCount - 1);
	}

	public void increaseCommentCount() {
		this.commentCount++;
	}

	public void decreaseCommentCount(int amount) {
		this.commentCount = Math.max(0, this.commentCount - amount);
	}
}
