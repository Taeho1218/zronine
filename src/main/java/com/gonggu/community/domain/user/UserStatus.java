package com.gonggu.community.domain.user;

/**
 * users.status ENUM('ACTIVE','PENDING_DELETE') 와 1:1 대응.
 * PENDING_DELETE 는 탈퇴 신청 후 30일 유예 기간 동안의 상태이며, 이 기간에는 로그인이 막힌다.
 */
public enum UserStatus {
	ACTIVE,
	PENDING_DELETE
}
