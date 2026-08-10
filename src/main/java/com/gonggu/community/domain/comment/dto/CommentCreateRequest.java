package com.gonggu.community.domain.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 댓글 작성 요청.
 * parentId 가 null 이면 원댓글, 값이 있으면 그 댓글에 대한 대댓글이다.
 * secret 은 댓글 작성란의 자물쇠 버튼에 대응한다.
 */
public record CommentCreateRequest(

	@NotBlank(message = "댓글 내용을 입력해주세요.")
	@Size(max = 2000, message = "댓글은 2000자를 넘을 수 없습니다.")
	String content,

	Long parentId,

	boolean secret
) {
}
