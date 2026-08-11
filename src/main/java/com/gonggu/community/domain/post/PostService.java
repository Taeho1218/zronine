package com.gonggu.community.domain.post;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.category.Category;
import com.gonggu.community.domain.category.CategoryService;
import com.gonggu.community.domain.category.dto.CategoryResponse;
import com.gonggu.community.domain.comment.CommentRepository;
import com.gonggu.community.domain.follow.FollowService;
import com.gonggu.community.domain.post.dto.PostCreateRequest;
import com.gonggu.community.domain.post.dto.PostDetailResponse;
import com.gonggu.community.domain.post.dto.PostFeedResponse;
import com.gonggu.community.domain.post.dto.PostSearchCondition;
import com.gonggu.community.domain.post.dto.PostUpdateRequest;
import com.gonggu.community.domain.postalert.PostAlertRepository;
import com.gonggu.community.domain.postcategory.PostCategory;
import com.gonggu.community.domain.postcategory.PostCategoryRepository;
import com.gonggu.community.domain.postlike.PostLikeRepository;
import com.gonggu.community.domain.postsave.PostSaveRepository;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserService;
import com.gonggu.community.global.common.PageResponse;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.ForbiddenException;
import com.gonggu.community.global.exception.InvalidRequestException;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

	/** 무한 스크롤 한 번에 내려갈 수 있는 게시글 수 상한 */
	public static final int MAX_PAGE_SIZE = 15;

	/** 이보다 짧은 검색어는 검색을 수행하지 않는다. */
	public static final int MIN_KEYWORD_LENGTH = 2;

	/** 상세페이지 "비슷한 상품"에 내려줄 최대 개수 */
	public static final int SIMILAR_LIMIT = 6;

	/** 홈 화면 "인기 피드"에 내려줄 개수 */
	public static final int POPULAR_LIMIT = 9;

	private final PostRepository postRepository;
	private final PostCategoryRepository postCategoryRepository;
	private final PostLikeRepository postLikeRepository;
	private final PostSaveRepository postSaveRepository;
	private final PostAlertRepository postAlertRepository;
	private final CommentRepository commentRepository;
	private final CategoryService categoryService;
	private final FollowService followService;
	private final UserService userService;

	@Transactional
	public PostDetailResponse create(Long userId, PostCreateRequest request) {
		User author = userService.getUserOrThrow(userId);
		validateByType(request.postType(), request.imageUrls(), request.productName(), request.price(),
			request.buyUrl(), request.startDate(), request.endDate(), request.eventNote(), request.categoryIds());

		Post post = postRepository.save(Post.builder()
			.user(author)
			.postType(request.postType())
			.title(request.title())
			.content(request.content())
			.imageUrls(request.imageUrls())
			.productName(request.productName())
			.price(request.price())
			.buyUrl(request.buyUrl())
			.startDate(request.startDate())
			.endDate(request.endDate())
			.eventNote(request.eventNote())
			.build());

		replaceCategories(post, request.categoryIds());

		return getDetail(post.getId(), userId);
	}

	@Transactional
	public PostDetailResponse update(Long userId, Long postId, PostUpdateRequest request) {
		Post post = getPostOrThrow(postId);
		if (!post.isOwnedBy(userId)) {
			throw new ForbiddenException(ErrorCode.FORBIDDEN, "본인이 작성한 글만 수정할 수 있습니다.");
		}

		validateByType(post.getPostType(), request.imageUrls(), request.productName(), request.price(),
			request.buyUrl(), request.startDate(), request.endDate(), request.eventNote(), request.categoryIds());

		post.update(request.title(), request.content(), request.imageUrls(), request.productName(), request.price(),
			request.buyUrl(), request.startDate(), request.endDate(), request.eventNote());

		// 카테고리는 부분 수정이 아니라 통째로 교체한다. (프론트가 선택 상태 전체를 보내는 구조)
		postCategoryRepository.deleteAllByPostId(postId);
		postCategoryRepository.flush();
		replaceCategories(post, request.categoryIds());

		return getDetail(postId, userId);
	}

	/**
	 * posts 를 참조하는 테이블에 ON DELETE CASCADE 가 없으므로,
	 * 자식 행(댓글/카테고리 매핑/저장/알림/좋아요)을 먼저 지운 뒤 게시글을 지운다.
	 * 순서가 어긋나면 FK 제약 위반으로 삭제가 실패한다.
	 */
	@Transactional
	public void delete(Long userId, Long postId) {
		Post post = getPostOrThrow(postId);
		if (!post.isOwnedBy(userId)) {
			throw new ForbiddenException(ErrorCode.FORBIDDEN, "본인이 작성한 글만 삭제할 수 있습니다.");
		}

		commentRepository.deleteAllByPostId(postId);
		postCategoryRepository.deleteAllByPostId(postId);
		postSaveRepository.deleteAllByPostId(postId);
		postAlertRepository.deleteAllByPostId(postId);
		postLikeRepository.deleteAllByPostId(postId);
		postRepository.delete(post);
	}

	public PostDetailResponse getDetail(Long postId, Long viewerId) {
		Post post = getPostOrThrow(postId);
		LocalDateTime now = LocalDateTime.now();

		boolean liked = viewerId != null && postLikeRepository.existsByUserIdAndPostId(viewerId, postId);
		boolean saved = viewerId != null && postSaveRepository.existsByUserIdAndPostId(viewerId, postId);
		// 알림받기는 셀러글 전용 기능이라 일반글에서는 조회 자체를 하지 않는다.
		boolean alerted = viewerId != null && post.isSeller()
			&& postAlertRepository.existsByUserIdAndPostId(viewerId, postId);
		boolean followingAuthor = !followService.findFollowingIds(viewerId, List.of(post.getUser().getId())).isEmpty();

		return PostDetailResponse.of(post, findCategories(postId), now, liked, saved, alerted, followingAuthor, viewerId);
	}

	/**
	 * 메인 페이지 피드 겸 검색 API. (검색어 + 카테고리 + 진행중/진행예정 필터)
	 *
	 * 세 조건은 서로 독립적이라 지정된 것만 AND 로 묶는다.
	 * 예: 카테고리=패션 + 검색어=신발 + 진행중 을 동시에 걸면 세 조건을 모두 만족하는 글만 남는다.
	 */
	public PageResponse<PostFeedResponse> search(PostSearchCondition condition, Long viewerId, Pageable pageable) {
		LocalDateTime now = LocalDateTime.now();
		Pageable limited = limitPageSize(pageable);

		// 너무 짧은 검색어는 사실상 전체 조회가 되어 무한 스크롤이 의미 없는 결과로 채워진다.
		// 검색어를 무시하고 전체를 돌려주면 "검색했는데 관련 없는 글이 나온다"로 보이므로 빈 결과로 끊는다.
		if (isTooShortKeyword(condition.keyword())) {
			return PageResponse.from(Page.<PostFeedResponse>empty(limited));
		}

		// 조건이 지정되지 않은 항목은 null 로 오므로 걸러내고 남은 것만 and 로 묶는다.
		Specification<Post> spec = combine(
			PostSpecifications.hasType(condition.postType()),
			PostSpecifications.hasCategory(condition.categoryId()),
			PostSpecifications.hasStatus(condition.status(), now),
			PostSpecifications.keywordContains(condition.keyword())
		);

		return toFeedPage(postRepository.findAll(spec, limited), viewerId, now);
	}

	/** 마이페이지 / 다른 사람 프로필의 작성 게시물 목록 */
	public PageResponse<PostFeedResponse> getPostsByUser(Long targetUserId, Long viewerId, Pageable pageable) {
		userService.getUserOrThrow(targetUserId);
		return toFeedPage(postRepository.findByUserIdOrderByIdDesc(targetUserId, limitPageSize(pageable)), viewerId,
			LocalDateTime.now());
	}

	/**
	 * 상세페이지의 "비슷한 상품" 목록. 셀러글에서만 의미가 있어 일반글이면 빈 목록을 돌려준다
	 * (일반글 상세페이지는 애초에 이 API를 호출하지 않을 것이므로 에러 대신 빈 목록으로 방어적으로 처리).
	 *
	 * 1순위: 같은 물건 이름(product_name)을 가진 다른 셀러글.
	 * 2순위(폴백): 1순위가 하나도 없으면, 이 글의 카테고리와 하나라도 겹치는 셀러글.
	 * 두 경우 다 최신순으로 SIMILAR_LIMIT 개까지만 내려준다.
	 */
	public List<PostFeedResponse> getSimilarPosts(Long postId, Long viewerId) {
		Post post = getPostOrThrow(postId);
		if (!post.isSeller()) {
			return List.of();
		}

		LocalDateTime now = LocalDateTime.now();
		Pageable limit = PageRequest.of(0, SIMILAR_LIMIT, Sort.by(Sort.Direction.DESC, "id"));

		Specification<Post> byProductName = combine(
			PostSpecifications.hasType(PostType.SELLER),
			PostSpecifications.excludingId(postId),
			PostSpecifications.sameProductName(post.getProductName())
		);
		List<Post> candidates = postRepository.findAll(byProductName, limit).getContent();

		if (candidates.isEmpty()) {
			List<Integer> categoryIds = postCategoryRepository.findAllByPostId(postId).stream()
				.map(mapping -> mapping.getCategory().getId())
				.toList();
			if (!categoryIds.isEmpty()) {
				Specification<Post> byCategory = combine(
					PostSpecifications.hasType(PostType.SELLER),
					PostSpecifications.excludingId(postId),
					PostSpecifications.hasAnyCategory(categoryIds)
				);
				candidates = postRepository.findAll(byCategory, limit).getContent();
			}
		}

		return mapToFeedResponses(candidates, viewerId, now);
	}

	/**
	 * 홈 화면 "인기 피드". 마감이 지난 셀러글은 후보에서 빠지고(일반글은 마감이 없어 항상 포함),
	 * 좋아요 많은 순 → 같으면 댓글 많은 순 → 그것도 같으면 최신순으로 POPULAR_LIMIT 개까지 내려준다.
	 */
	public List<PostFeedResponse> getPopularPosts(Long viewerId) {
		LocalDateTime now = LocalDateTime.now();
		Pageable limit = PageRequest.of(0, POPULAR_LIMIT, Sort.by(
			Sort.Order.desc("likeCount"),
			Sort.Order.desc("commentCount"),
			Sort.Order.desc("id")
		));

		List<Post> posts = postRepository.findAll(PostSpecifications.notEnded(now), limit).getContent();
		return mapToFeedResponses(posts, viewerId, now);
	}

	/**
	 * 공백만 있는 검색어는 "검색 안 함"으로 보고 전체 목록을 돌려주지만,
	 * 한 글자짜리 검색어는 검색 의도가 있는 요청이라 최소 길이 미달로 처리한다.
	 */
	private boolean isTooShortKeyword(String keyword) {
		return keyword != null && !keyword.isBlank() && keyword.trim().length() < MIN_KEYWORD_LENGTH;
	}

	/**
	 * 무한 스크롤 한 번에 내려갈 수 있는 최대 개수를 서버가 강제한다.
	 * 클라이언트가 size 를 크게 보내 한 번에 전부 긁어가는 것을 막기 위해 컨트롤러 기본값과 별개로 여기서 자른다.
	 */
	private Pageable limitPageSize(Pageable pageable) {
		if (pageable.getPageSize() <= MAX_PAGE_SIZE) {
			return pageable;
		}
		return PageRequest.of(pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
	}

	/**
	 * 피드 카드마다 카테고리/좋아요 여부/저장 여부/팔로우 여부를 개별 조회하면 카드 수만큼 쿼리가 늘어난다.
	 * 페이지에 실린 id 들을 모아 한 번씩만 조회한 뒤 메모리에서 조립한다.
	 */
	public PageResponse<PostFeedResponse> toFeedPage(Page<Post> page, Long viewerId, LocalDateTime now) {
		boolean hasNext = page.hasNext();
		return new PageResponse<>(
			mapToFeedResponses(page.getContent(), viewerId, now),
			page.getNumber(),
			page.getSize(),
			page.getTotalElements(),
			page.getTotalPages(),
			page.isFirst(),
			page.isLast(),
			hasNext,
			hasNext ? page.getNumber() + 1 : null
		);
	}

	/**
	 * toFeedPage 와 getSimilarPosts 가 공유하는 배치 조회 로직.
	 * 목록이 페이지로 묶여있든(무한 스크롤) 그냥 리스트든(비슷한 상품) 상관없이,
	 * 카테고리/좋아요/저장/팔로우 여부를 id 목록 기준으로 한 번씩만 조회해 N+1 을 피한다.
	 */
	private List<PostFeedResponse> mapToFeedResponses(List<Post> posts, Long viewerId, LocalDateTime now) {
		List<Long> postIds = posts.stream().map(Post::getId).toList();

		Map<Long, List<CategoryResponse>> categoryMap = findCategoryMap(postIds);
		Set<Long> likedIds = findLikedIds(viewerId, postIds);
		Set<Long> savedIds = findSavedIds(viewerId, postIds);
		Set<Long> followingIds = followService.findFollowingIds(viewerId,
			posts.stream().map(post -> post.getUser().getId()).distinct().toList());

		return posts.stream()
			.map(post -> PostFeedResponse.of(
				post,
				categoryMap.getOrDefault(post.getId(), List.of()),
				now,
				likedIds.contains(post.getId()),
				savedIds.contains(post.getId()),
				followingIds.contains(post.getUser().getId()),
				viewerId
			))
			.toList();
	}

	@SafeVarargs
	private static Specification<Post> combine(Specification<Post>... specifications) {
		Specification<Post> result = null;
		for (Specification<Post> specification : specifications) {
			if (specification == null) {
				continue;
			}
			result = (result == null) ? specification : result.and(specification);
		}
		return result;
	}

	public Post getPostOrThrow(Long postId) {
		return postRepository.findById(postId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.POST_NOT_FOUND));
	}

	private List<CategoryResponse> findCategories(Long postId) {
		return postCategoryRepository.findAllByPostId(postId).stream()
			.map(mapping -> CategoryResponse.from(mapping.getCategory()))
			.toList();
	}

	private Map<Long, List<CategoryResponse>> findCategoryMap(Collection<Long> postIds) {
		if (postIds.isEmpty()) {
			return Map.of();
		}
		Map<Long, List<CategoryResponse>> result = new HashMap<>();
		for (PostCategory mapping : postCategoryRepository.findAllByPostIdIn(postIds)) {
			result.computeIfAbsent(mapping.getId().getPostId(), key -> new ArrayList<>())
				.add(CategoryResponse.from(mapping.getCategory()));
		}
		return result;
	}

	private Set<Long> findLikedIds(Long viewerId, Collection<Long> postIds) {
		if (viewerId == null || postIds.isEmpty()) {
			return Set.of();
		}
		return Set.copyOf(postLikeRepository.findLikedPostIdsIn(viewerId, postIds));
	}

	private Set<Long> findSavedIds(Long viewerId, Collection<Long> postIds) {
		if (viewerId == null || postIds.isEmpty()) {
			return Set.of();
		}
		return Set.copyOf(postSaveRepository.findSavedPostIdsIn(viewerId, postIds));
	}

	private void replaceCategories(Post post, List<Integer> categoryIds) {
		if (categoryIds == null || categoryIds.isEmpty()) {
			return;
		}
		// 프론트에서 같은 카테고리를 중복으로 보내면 복합키 충돌이 나므로 중복을 먼저 걷어낸다.
		List<Integer> distinctIds = categoryIds.stream().distinct().toList();
		List<Category> categories = categoryService.findAllByIdsOrThrow(distinctIds);
		postCategoryRepository.saveAll(categories.stream().map(category -> new PostCategory(post, category)).toList());
	}

	/**
	 * 셀러 전용 컬럼은 DB 에서 전부 NULL 허용이라 스키마가 필수값을 강제해주지 않는다.
	 * "SELLER 면 사진/모집기간/물건이름/가격/구매링크/카테고리가 반드시 있어야 한다"는 규칙은
	 * 이 지점이 유일한 방어선이므로 여기서 모두 검증한다.
	 *
	 * 반대로 GENERAL 에 셀러 전용 값이 들어오면 조용히 저장하지 않고 거절한다.
	 * 저장해두면 나중에 진행중/진행예정 필터에 일반글이 섞여 들어올 수 있기 때문이다.
	 */
	private void validateByType(PostType postType, List<String> imageUrls, String productName, BigDecimal price,
		String buyUrl, LocalDateTime startDate, LocalDateTime endDate, String eventNote, List<Integer> categoryIds) {

		if (postType == PostType.SELLER) {
			requireNotEmpty(imageUrls, "셀러 게시글은 사진을 1장 이상 등록해야 합니다.");
			requireNotBlank(productName, "물건 이름을 입력해주세요.");
			if (price == null) {
				throw new InvalidRequestException(ErrorCode.SELLER_FIELD_REQUIRED, "가격을 입력해주세요.");
			}
			requireNotBlank(buyUrl, "구매링크를 입력해주세요.");
			if (startDate == null || endDate == null) {
				throw new InvalidRequestException(ErrorCode.SELLER_FIELD_REQUIRED, "모집 기간을 입력해주세요.");
			}
			if (!endDate.isAfter(startDate)) {
				throw new InvalidRequestException(ErrorCode.INVALID_RECRUIT_PERIOD);
			}
			requireNotEmpty(categoryIds, "카테고리를 1개 이상 선택해주세요.");
			return;
		}

		boolean hasSellerOnlyValue = productName != null || price != null || buyUrl != null
			|| startDate != null || endDate != null || eventNote != null
			|| (categoryIds != null && !categoryIds.isEmpty());
		if (hasSellerOnlyValue) {
			throw new InvalidRequestException(ErrorCode.GENERAL_POST_HAS_SELLER_FIELD);
		}
	}

	private void requireNotBlank(String value, String message) {
		if (value == null || value.isBlank()) {
			throw new InvalidRequestException(ErrorCode.SELLER_FIELD_REQUIRED, message);
		}
	}

	private void requireNotEmpty(Collection<?> value, String message) {
		if (value == null || value.isEmpty()) {
			throw new InvalidRequestException(ErrorCode.SELLER_FIELD_REQUIRED, message);
		}
	}
}
