package com.gonggu.community.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 프론트가 메시지 문자열이 아니라 코드로 분기할 수 있도록 에러를 열거형으로 고정한다.
 * (예: 닉네임 중복은 회원가입 폼에서 필드 단위 에러로 표시해야 하므로 별도 코드가 필요)
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

	// 공통
	INVALID_INPUT(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
	METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

	// 인증 / 인가
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
	INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
	EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
	INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
	LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),

	// 회원
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."),
	EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
	NICKNAME_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
	WITHDRAWN_USER(HttpStatus.FORBIDDEN, "탈퇴 처리 중인 계정입니다."),
	TERMS_NOT_AGREED(HttpStatus.BAD_REQUEST, "약관에 동의해야 가입할 수 있습니다."),

	// 팔로우
	CANNOT_FOLLOW_SELF(HttpStatus.BAD_REQUEST, "자기 자신은 팔로우할 수 없습니다."),
	ALREADY_FOLLOWING(HttpStatus.CONFLICT, "이미 팔로우한 회원입니다."),
	FOLLOW_NOT_FOUND(HttpStatus.NOT_FOUND, "팔로우 상태가 아닙니다."),

	// 카테고리
	CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),
	CATEGORY_DUPLICATED(HttpStatus.CONFLICT, "이미 존재하는 카테고리입니다."),

	// 게시글
	POST_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 게시글입니다."),
	SELLER_FIELD_REQUIRED(HttpStatus.BAD_REQUEST, "셀러 게시글의 필수 항목이 누락되었습니다."),
	INVALID_RECRUIT_PERIOD(HttpStatus.BAD_REQUEST, "모집 종료일은 시작일 이후여야 합니다."),
	GENERAL_POST_HAS_SELLER_FIELD(HttpStatus.BAD_REQUEST, "일반 게시글에는 셀러 전용 항목을 입력할 수 없습니다."),

	// 댓글
	COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 댓글입니다."),
	REPLY_DEPTH_EXCEEDED(HttpStatus.BAD_REQUEST, "대댓글에는 다시 답글을 달 수 없습니다."),
	PARENT_COMMENT_POST_MISMATCH(HttpStatus.BAD_REQUEST, "부모 댓글이 해당 게시글의 댓글이 아닙니다."),

	// 저장 / 알림 / 좋아요
	ALREADY_SAVED(HttpStatus.CONFLICT, "이미 저장한 게시글입니다."),
	SAVE_NOT_FOUND(HttpStatus.NOT_FOUND, "저장하지 않은 게시글입니다."),
	ALREADY_ALERTED(HttpStatus.CONFLICT, "이미 알림을 신청한 게시글입니다."),
	ALERT_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 신청하지 않은 게시글입니다."),
	ALERT_ONLY_FOR_SELLER_POST(HttpStatus.BAD_REQUEST, "알림받기는 셀러 게시글에만 신청할 수 있습니다."),
	ALREADY_LIKED(HttpStatus.CONFLICT, "이미 추천한 게시글입니다."),
	LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "추천하지 않은 게시글입니다."),

	// 업로드
	EMPTY_FILE(HttpStatus.BAD_REQUEST, "업로드할 파일이 비어 있습니다."),
	UNSUPPORTED_IMAGE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 형식입니다."),
	FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "허용된 파일 크기를 초과했습니다."),
	FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
	PRESIGN_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "현재 업로드 저장소는 사전 서명 URL을 지원하지 않습니다.");

	private final HttpStatus httpStatus;
	private final String defaultMessage;
}
