package com.gonggu.community.domain.postsave;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostSaveRepository extends JpaRepository<PostSave, Long> {

	Optional<PostSave> findByUserIdAndPostId(Long userId, Long postId);

	boolean existsByUserIdAndPostId(Long userId, Long postId);

	@EntityGraph(attributePaths = {"post", "post.user"})
	Page<PostSave> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);

	/** 피드에서 글마다 "내가 저장했는지"를 개별 조회하지 않도록 한 번에 모아온다. */
	@Query("select s.post.id from PostSave s where s.user.id = :userId and s.post.id in :postIds")
	List<Long> findSavedPostIdsIn(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

	void deleteAllByPostId(Long postId);
}
