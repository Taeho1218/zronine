package com.gonggu.community.domain.comment.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.gonggu.community.domain.comment.Comment;
import com.gonggu.community.domain.user.dto.UserSummaryResponse;

/**
 * 댓글 한 건. 대댓글은 replies 에 중첩되며, 깊이는 1단계까지만 존재한다.
 *
 * secret=true 인데 볼 권한이 없는 사용자에게는 content 를 마스킹 문구로 바꿔 내려준다.
 * 응답 자체를 빼버리면 댓글 수와 목록 개수가 어긋나고 "비밀댓글이 달렸다"는 사실도 보여줄 수 없어서,
 * 항목은 남기고 내용만 가린다. visible 플래그로 프론트가 자물쇠 아이콘을 그릴 수 있다.
 */
public record CommentResponse(
	Long commentId,
	Long parentId,
	UserSummaryResponse author,
	String content,
	boolean secret,
	boolean visible,
	boolean mine,
	LocalDateTime createdAt,
	List<CommentResponse> replies
) {

	public static final String MASKED_CONTENT = "비밀 댓글입니다.";

	public static CommentResponse of(Comment comment, boolean visible, Long viewerId, List<CommentResponse> replies) {
		return new CommentResponse(
			comment.getId(),
			comment.getParent() == null ? null : comment.getParent().getId(),
			UserSummaryResponse.from(comment.getUser()),
			visible ? comment.getContent() : MASKED_CONTENT,
			comment.isSecret(),
			visible,
			viewerId != null && comment.isOwnedBy(viewerId),
			comment.getCreatedAt(),
			replies
		);
	}
}
