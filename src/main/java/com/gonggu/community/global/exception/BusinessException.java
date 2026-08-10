package com.gonggu.community.global.exception;

import lombok.Getter;

/**
 * 서비스 레이어의 비즈니스 규칙 위반을 표현하는 최상위 예외.
 * GlobalExceptionHandler 가 이 타입 하나만 잡아도 모든 도메인 예외를 일관된 응답으로 변환할 수 있게 한다.
 */
@Getter
public class BusinessException extends RuntimeException {

	private final ErrorCode errorCode;

	public BusinessException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public BusinessException(ErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}
}
