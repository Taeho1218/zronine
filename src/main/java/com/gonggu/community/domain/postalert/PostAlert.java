package com.gonggu.community.domain.postalert;

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
 * 셀러글의 "알림받기" 신청 내역.
 * 마이페이지 알람 내역에서 사진/물건이름/기간/구매하러가기 버튼을 그리는 데 쓰인다.
 */
@Entity
@Table(name = "post_alerts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostAlert {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "alert_id")
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

	public PostAlert(User user, Post post) {
		this.user = user;
		this.post = post;
	}
}
