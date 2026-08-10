package com.gonggu.community.domain.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

	/** 마이페이지 / 다른 사람 프로필의 "작성한 게시물" 목록 */
	Page<Post> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);

	long countByUserId(Long userId);
}
