package com.gonggu.community.domain.postlike;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

	Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);

	boolean existsByUserIdAndPostId(Long userId, Long postId);

	long countByPostId(Long postId);

	/** 피드에서 글마다 "내가 추천했는지"를 개별 조회하지 않도록 한 번에 모아온다. */
	@Query("select l.post.id from PostLike l where l.user.id = :userId and l.post.id in :postIds")
	List<Long> findLikedPostIdsIn(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

	void deleteAllByPostId(Long postId);
}
