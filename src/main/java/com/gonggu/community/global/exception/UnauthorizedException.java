package com.gonggu.community.global.exception;

public class UnauthorizedException extends BusinessException {

	public UnauthorizedException(ErrorCode errorCode) {
		super(errorCode);
	}

	public UnauthorizedException(ErrorCode errorCode, String message) {
		super(errorCode, message);
	}
}
