package com.gonggu.community.domain.comment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.comment.dto.CommentCreateRequest;
import com.gonggu.community.domain.comment.dto.CommentResponse;
import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.post.PostService;
import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserService;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.ForbiddenException;
import com.gonggu.community.global.exception.InvalidRequestException;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

	private final CommentRepository commentRepository;
	private final PostService postService;
	private final UserService userService;

	/**
	 * 댓글 생성 시 posts.comment_count 를 같은 트랜잭션에서 함께 올린다.
	 * 카운터는 조회 성능을 위한 비정규화 값이라, 댓글 행과 따로 커밋되면 화면의 댓글 수가 실제와 어긋난다.
	 *
	 * 대댓글은 세지 않는다 — 피드/상세 페이지에 노출되는 "댓글 수"는 원댓글 개수만을 의미하기로 했다.
	 */
	@Transactional
	public CommentResponse create(Long userId, Long postId, CommentCreateRequest request) {
		Post post = postService.getPostOrThrow(postId);
		User writer = userService.getUserOrThrow(userId);

		Comment parent = resolveParent(request.parentId(), postId);

		Comment comment = commentRepository.save(
			new Comment(post, writer, parent, request.content(), request.secret()));
		if (parent == null) {
			post.increaseCommentCount();
		}

		return CommentResponse.of(comment, true, userId, List.of());
	}

	/**
	 * 대댓글의 대댓글(3단계)은 금지한다.
	 * 부모로 지정된 댓글이 이미 대댓글이면(parent_id 가 있으면) 거부해서 깊이를 2단계로 고정한다.
	 * DB 는 자기참조 FK 만 걸려 있어 깊이를 막아주지 않으므로 이 검사가 유일한 방어선이다.
	 */
	private Comment resolveParent(Long parentId, Long postId) {
		if (parentId == null) {
			return null;
		}
		Comment parent = commentRepository.findById(parentId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.COMMENT_NOT_FOUND));

		if (parent.isReply()) {
			throw new InvalidRequestException(ErrorCode.REPLY_DEPTH_EXCEEDED);
		}
		// 다른 글의 댓글을 부모로 지정하면 목록 조립이 깨지므로 같은 게시글인지 확인한다.
		if (!parent.getPost().getId().equals(postId)) {
			throw new InvalidRequestException(ErrorCode.PARENT_COMMENT_POST_MISMATCH);
		}
		return parent;
	}

	/**
	 * 게시글의 댓글 전체를 한 번에 읽어 원댓글 -> 대댓글 트리로 조립한다.
	 * 비밀댓글은 여기서 조회자에 따라 내용을 가린다.
	 */
	public List<CommentResponse> getComments(Long postId, Long viewerId) {
		Post post = postService.getPostOrThrow(postId);
		Long postAuthorId = post.getUser().getId();

		List<Comment> comments = commentRepository.findAllByPostIdOrderByIdAsc(postId);

		Map<Long, List<CommentResponse>> repliesByParent = new HashMap<>();
		for (Comment comment : comments) {
			if (comment.isReply()) {
				repliesByParent.computeIfAbsent(comment.getParent().getId(), key -> new ArrayList<>())
					.add(CommentResponse.of(comment, canRead(comment, viewerId, postAuthorId), viewerId, List.of()));
			}
		}

		List<CommentResponse> result = new ArrayList<>();
		for (Comment comment : comments) {
			if (!comment.isReply()) {
				result.add(CommentResponse.of(
					comment,
					canRead(comment, viewerId, postAuthorId),
					viewerId,
					repliesByParent.getOrDefault(comment.getId(), List.of())
				));
			}
		}
		return result;
	}

	/**
	 * 비밀댓글 열람 권한:
	 * 댓글 작성자 본인이거나, 그 댓글이 달린 게시글의 작성자만 내용을 볼 수 있다.
	 * (문의성 비밀댓글이 셀러에게는 보여야 답변이 가능하기 때문)
	 */
	private boolean canRead(Comment comment, Long viewerId, Long postAuthorId) {
		if (!comment.isSecret()) {
			return true;
		}
		if (viewerId == null) {
			return false;
		}
		return comment.isOwnedBy(viewerId) || viewerId.equals(postAuthorId);
	}

	/**
	 * 원댓글을 지우면 거기 달린 대댓글도 함께 사라진다.
	 * comment_count 는 원댓글 개수만 세므로, 원댓글을 지울 때만 1 내리고 대댓글은 애초에 세지 않았으니
	 * 몇 개가 딸려 지워지든 카운터에는 손대지 않는다.
	 */
	@Transactional
	public void delete(Long userId, Long commentId) {
		Comment comment = commentRepository.findById(commentId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.COMMENT_NOT_FOUND));

		if (!comment.isOwnedBy(userId)) {
			throw new ForbiddenException(ErrorCode.FORBIDDEN, "본인이 작성한 댓글만 삭제할 수 있습니다.");
		}

		Post post = comment.getPost();
		boolean wasReply = comment.isReply();

		List<Comment> replies = wasReply ? List.of() : commentRepository.findAllByParentId(commentId);
		commentRepository.deleteAll(replies);
		commentRepository.delete(comment);

		if (!wasReply) {
			post.decreaseCommentCount(1);
		}
	}
}
