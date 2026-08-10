package com.gonggu.community.domain.postalert;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostAlertRepository extends JpaRepository<PostAlert, Long> {

	Optional<PostAlert> findByUserIdAndPostId(Long userId, Long postId);

	boolean existsByUserIdAndPostId(Long userId, Long postId);

	@EntityGraph(attributePaths = {"post", "post.user"})
	Page<PostAlert> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);

	@Query("select a.post.id from PostAlert a where a.user.id = :userId and a.post.id in :postIds")
	List<Long> findAlertedPostIdsIn(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

	void deleteAllByPostId(Long postId);
}
