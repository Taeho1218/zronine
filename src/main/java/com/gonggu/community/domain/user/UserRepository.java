package com.gonggu.community.domain.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	boolean existsByNickname(String nickname);

	/** 닉네임 변경 시 자기 자신의 현재 닉네임은 중복으로 보지 않기 위한 조회 */
	boolean existsByNicknameAndIdNot(String nickname, Long id);
}
