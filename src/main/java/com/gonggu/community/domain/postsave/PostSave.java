package com.gonggu.community.domain.postsave;

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

/**
 * 마이페이지 "저장목록"에 노출되는 북마크.
 * (user_id, post_id) UNIQUE 로 같은 글을 두 번 저장할 수 없다.
 */
@Entity
@Table(name = "post_saves")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostSave {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "save_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public PostSave(User user, Post post) {
		this.user = user;
		this.post = post;
	}
}
