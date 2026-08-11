package com.gonggu.community.domain.user;

import java.time.LocalDateTime;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 피드/댓글 목록은 여러 글의 작성자 프로필을 한 화면에 함께 그린다.
 * 지연 로딩된 User 프록시를 하나씩 초기화하면 항목 수만큼 조회가 나가므로
 * BatchSize 로 IN 절 한 번에 묶어 가져오게 한다.
 */
@Entity
@Table(name = "users")
@BatchSize(size = 100)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Long id;

	@Column(name = "email", nullable = false, length = 255)
	private String email;

	/** BCrypt 해시만 저장한다. 평문은 어떤 경우에도 보관하지 않는다. */
	@Column(name = "password", nullable = false, length = 255)
	private String password;

	@Column(name = "nickname", nullable = false, length = 50)
	private String nickname;

	@Column(name = "profile_image_url", length = 512)
	private String profileImageUrl;

	@Column(name = "instagram_url", length = 255)
	private String instagramUrl;

	@Column(name = "cover_image_url", length = 512)
	private String coverImageUrl;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private UserStatus status;

	/**
	 * 약관에 동의한 시각. NOT NULL 이고 DB 기본값도 없어 가입 시점에 반드시 채워야 한다.
	 * 동의 여부를 boolean 이 아니라 시각으로 남기는 이유는, 약관이 개정됐을 때
	 * 어느 버전에 동의한 회원인지 가입 시점으로 역추적할 수 있어야 하기 때문이다.
	 */
	@Column(name = "terms_agreed_at", nullable = false, updatable = false)
	private LocalDateTime termsAgreedAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@Builder
	private User(String email, String password, String nickname, String profileImageUrl,
		LocalDateTime termsAgreedAt) {
		this.email = email;
		this.password = password;
		this.nickname = nickname;
		this.profileImageUrl = profileImageUrl;
		this.termsAgreedAt = termsAgreedAt;
		this.status = UserStatus.ACTIVE;
	}

	public void changeNickname(String nickname) {
		this.nickname = nickname;
	}

	public void changeProfileImageUrl(String profileImageUrl) {
		this.profileImageUrl = profileImageUrl;
	}

	public void changeInstagramUrl(String instagramUrl) {
		this.instagramUrl = instagramUrl;
	}

	public void changeCoverImageUrl(String coverImageUrl) {
		this.coverImageUrl = coverImageUrl;
	}

	public void changePassword(String encodedPassword) {
		this.password = encodedPassword;
	}

	/**
	 * 회원 탈퇴는 하드 삭제가 아니라 Soft Delete 로 처리한다.
	 * 이 회원이 남긴 게시글/댓글이 FK 로 물려 있어 즉시 지우면 다른 사용자가 보던 글까지 깨지고,
	 * 30일 안에 마음이 바뀌면 복구할 수 있어야 하기 때문이다.
	 * 실제 물리 삭제는 별도 배치 잡의 책임이다.
	 */
	public void withdraw() {
		this.status = UserStatus.PENDING_DELETE;
		this.deletedAt = LocalDateTime.now();
	}

	public void restore() {
		this.status = UserStatus.ACTIVE;
		this.deletedAt = null;
	}

	public boolean isActive() {
		return this.status == UserStatus.ACTIVE;
	}
}
