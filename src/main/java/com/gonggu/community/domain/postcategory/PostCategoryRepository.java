package com.gonggu.community.domain.postcategory;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCategoryRepository extends JpaRepository<PostCategory, PostCategoryId> {

	@EntityGraph(attributePaths = "category")
	List<PostCategory> findAllByPostId(Long postId);

	/** 피드 목록에서 글마다 카테고리를 개별 조회하면 N+1 이 되므로 한 번에 모아 온다. */
	@EntityGraph(attributePaths = "category")
	List<PostCategory> findAllByPostIdIn(Collection<Long> postIds);

	void deleteAllByPostId(Long postId);
}
