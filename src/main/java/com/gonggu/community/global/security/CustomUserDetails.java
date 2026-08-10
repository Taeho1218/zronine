package com.gonggu.community.global.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserStatus;

import lombok.Getter;

/**
 * 컨트롤러에서 @AuthenticationPrincipal 로 바로 userId 를 꺼내 쓸 수 있도록
 * Spring Security 의 UserDetails 에 도메인 식별자를 얹은 어댑터.
 */
@Getter
public class CustomUserDetails implements UserDetails {

	private final Long userId;
	private final String email;
	private final String password;
	private final String nickname;
	private final UserStatus status;

	public CustomUserDetails(User user) {
		this.userId = user.getId();
		this.email = user.getEmail();
		this.password = user.getPassword();
		this.nickname = user.getNickname();
		this.status = user.getStatus();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_USER"));
	}

	@Override
	public String getUsername() {
		return email;
	}

	/**
	 * 탈퇴 유예(PENDING_DELETE) 상태의 계정은 비활성으로 취급해 로그인/인증을 막는다.
	 */
	@Override
	public boolean isEnabled() {
		return status == UserStatus.ACTIVE;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}
}
