package com.gonggu.community.domain.comment;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.gonggu.community.domain.post.Post;
import com.gonggu.community.domain.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "comment_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/**
	 * null 이면 원댓글, 값이 있으면 그 댓글에 달린 대댓글.
	 * 자기 참조 FK 구조상 depth 가 무한히 깊어질 수 있으나,
	 * 화면 정책상 2단계(원댓글 + 대댓글)까지만 허용하므로 깊이 제한은 서비스에서 강제한다.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_id")
	private Comment parent;

	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	/**
	 * 비밀댓글. true 면 댓글 작성자 본인과 게시글 작성자에게만 내용이 보이고
	 * 나머지 사용자에게는 마스킹된 문구로 응답한다.
	 */
	@Column(name = "is_secret", nullable = false)
	private boolean secret;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public Comment(Post post, User user, Comment parent, String content, boolean secret) {
		this.post = post;
		this.user = user;
		this.parent = parent;
		this.content = content;
		this.secret = secret;
	}

	public boolean isReply() {
		return this.parent != null;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}
}
