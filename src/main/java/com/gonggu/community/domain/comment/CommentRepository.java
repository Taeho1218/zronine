package com.gonggu.community.domain.comment;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

	/**
	 * 목록은 원댓글 -> 그 아래 대댓글 순으로 조립해야 하므로 게시글의 전체 댓글을 한 번에 읽고
	 * 서비스에서 트리로 묶는다. (작성자 정보는 함께 페치해 N+1 방지)
	 */
	@EntityGraph(attributePaths = {"user", "parent"})
	List<Comment> findAllByPostIdOrderByIdAsc(Long postId);

	/** 원댓글을 지울 때 함께 지워야 하는 대댓글들 */
	List<Comment> findAllByParentId(Long parentId);

	/**
	 * 게시글 삭제 시 댓글을 한 번에 정리한다.
	 * 영속성 컨텍스트를 비우면(clearAutomatically) 호출부가 들고 있던 Post 가 준영속이 되어
	 * 뒤이은 삭제가 깨지므로 flush 만 하고 clear 는 하지 않는다.
	 */
	@Modifying(flushAutomatically = true)
	@Query("delete from Comment c where c.post.id = :postId")
	int deleteAllByPostId(@Param("postId") Long postId);
}
