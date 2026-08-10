package com.gonggu.community.domain.follow;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FollowRepository extends JpaRepository<Follow, Long> {

	Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

	boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

	long countByFollowerId(Long followerId);

	long countByFollowingId(Long followingId);

	Page<Follow> findByFollowingIdOrderByIdDesc(Long followingId, Pageable pageable);

	Page<Follow> findByFollowerIdOrderByIdDesc(Long followerId, Pageable pageable);

	/**
	 * 피드나 댓글 목록처럼 여러 작성자가 한 화면에 나오는 경우,
	 * 작성자마다 팔로우 여부를 따로 조회하면 N+1 이 되므로 한 번에 팔로우 중인 id 집합을 받아온다.
	 */
	@Query("select f.following.id from Follow f where f.follower.id = :followerId and f.following.id in :targetIds")
	List<Long> findFollowingIdsIn(@Param("followerId") Long followerId, @Param("targetIds") Collection<Long> targetIds);
}
