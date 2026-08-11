package com.gonggu.community.domain.post;

import java.time.LocalDateTime;
import java.util.Collection;

import org.springframework.data.jpa.domain.Specification;

import com.gonggu.community.domain.postcategory.PostCategory;

import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/**
 * 메인 페이지의 "카테고리 + 진행중/진행예정" 필터는 조합이 여러 갈래라
 * JPQL 을 조건마다 분기해 쓰면 쿼리 메서드가 폭증한다.
 * 조건을 Specification 조각으로 나눠 필요한 것만 and 로 붙이는 방식으로 정리했다.
 */
public final class PostSpecifications {

	private PostSpecifications() {
	}

	public static Specification<Post> hasType(PostType postType) {
		if (postType == null) {
			return null;
		}
		return (root, query, cb) -> cb.equal(root.get("postType"), postType);
	}

	/**
	 * 카테고리 매핑은 N:M 이라 join 으로 걸면 한 글이 여러 행으로 중복된다.
	 * 페이징 개수가 어긋나지 않도록 join 대신 EXISTS 서브쿼리로 필터링한다.
	 */
	public static Specification<Post> hasCategory(Integer categoryId) {
		if (categoryId == null) {
			return null;
		}
		return (root, query, cb) -> {
			Subquery<Long> subquery = query.subquery(Long.class);
			Root<PostCategory> mapping = subquery.from(PostCategory.class);
			subquery.select(cb.literal(1L))
				.where(
					cb.equal(mapping.get("post").get("id"), root.get("id")),
					cb.equal(mapping.get("category").get("id"), categoryId)
				);
			return cb.exists(subquery);
		};
	}

	/**
	 * 진행중 = SELLER 이면서 now 가 모집기간 안에 있는 글
	 * 진행예정 = SELLER 이면서 모집 시작일이 아직 오지 않은 글
	 * 두 필터 모두 기간 컬럼이 있는 셀러글에만 의미가 있으므로 post_type 조건을 함께 건다.
	 */
	public static Specification<Post> hasStatus(PostStatusFilter status, LocalDateTime now) {
		if (status == null || status == PostStatusFilter.ALL) {
			return null;
		}
		return (root, query, cb) -> {
			if (status == PostStatusFilter.ONGOING) {
				return cb.and(
					cb.equal(root.get("postType"), PostType.SELLER),
					cb.lessThanOrEqualTo(root.get("startDate"), now),
					cb.greaterThanOrEqualTo(root.get("endDate"), now)
				);
			}
			return cb.and(
				cb.equal(root.get("postType"), PostType.SELLER),
				cb.greaterThan(root.get("startDate"), now)
			);
		};
	}

	public static Specification<Post> writtenBy(Long userId) {
		if (userId == null) {
			return null;
		}
		return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
	}

	public static Specification<Post> excludingId(Long postId) {
		if (postId == null) {
			return null;
		}
		return (root, query, cb) -> cb.notEqual(root.get("id"), postId);
	}

	/** "비슷한 상품" 1순위 조건 — 같은 물건 이름을 가진 다른 셀러글. */
	public static Specification<Post> sameProductName(String productName) {
		if (productName == null || productName.isBlank()) {
			return null;
		}
		return (root, query, cb) -> cb.equal(root.get("productName"), productName);
	}

	/**
	 * "비슷한 상품" 2순위(폴백) 조건 — 주어진 카테고리 중 하나라도 겹치는 글.
	 * hasCategory 와 같은 EXISTS 서브쿼리 방식이되, 카테고리 하나가 아니라 목록 중 하나만 겹쳐도 매칭시킨다.
	 */
	public static Specification<Post> hasAnyCategory(Collection<Integer> categoryIds) {
		if (categoryIds == null || categoryIds.isEmpty()) {
			return null;
		}
		return (root, query, cb) -> {
			Subquery<Long> subquery = query.subquery(Long.class);
			Root<PostCategory> mapping = subquery.from(PostCategory.class);
			subquery.select(cb.literal(1L))
				.where(
					cb.equal(mapping.get("post").get("id"), root.get("id")),
					mapping.get("category").get("id").in(categoryIds)
				);
			return cb.exists(subquery);
		};
	}

	/**
	 * 검색어가 제목(posts.title) 또는 그 글에 매핑된 카테고리명(categories.name) 중
	 * 하나라도 포함되면 매칭으로 본다. (LIKE '%keyword%')
	 *
	 * 카테고리 쪽은 N:M 이라 join 으로 걸면 카테고리를 여러 개 가진 글이 여러 행으로 중복돼
	 * 페이지당 개수가 어긋난다. hasCategory 와 같은 이유로 EXISTS 서브쿼리를 쓴다.
	 *
	 * 최소 길이 검증은 호출부(PostService)의 책임이다.
	 * 여기서 조용히 null 을 돌려주면 "한 글자 검색"이 전체 목록 조회로 바뀌어버려,
	 * 검색이 수행되지 않았다는 사실이 응답에서 드러나지 않기 때문이다.
	 */
	public static Specification<Post> keywordContains(String keyword) {
		if (keyword == null || keyword.isBlank()) {
			return null;
		}
		String pattern = "%" + keyword.trim().toLowerCase() + "%";

		return (root, query, cb) -> {
			Subquery<Long> subquery = query.subquery(Long.class);
			Root<PostCategory> mapping = subquery.from(PostCategory.class);
			subquery.select(cb.literal(1L))
				.where(
					cb.equal(mapping.get("post").get("id"), root.get("id")),
					cb.like(cb.lower(mapping.get("category").get("name")), pattern)
				);

			return cb.or(
				cb.like(cb.lower(root.get("title")), pattern),
				cb.exists(subquery)
			);
		};
	}
}
