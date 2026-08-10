package com.gonggu.community.global.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.user.User;
import com.gonggu.community.domain.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		User user = userRepository.findByEmail(email)
			.orElseThrow(() -> new UsernameNotFoundException("이메일에 해당하는 회원이 없습니다: " + email));
		return new CustomUserDetails(user);
	}

	/**
	 * JWT 에는 userId 를 subject 로 담기 때문에, 필터에서 토큰을 검증한 뒤에는
	 * 이메일이 아니라 PK 로 회원을 다시 조회한다. (이메일은 변경 가능성이 있는 값)
	 */
	@Transactional(readOnly = true)
	public UserDetails loadUserById(Long userId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new UsernameNotFoundException("회원을 찾을 수 없습니다: " + userId));
		return new CustomUserDetails(user);
	}
}
