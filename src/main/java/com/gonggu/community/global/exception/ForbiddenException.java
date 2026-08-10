package com.gonggu.community.global.exception;

public class ForbiddenException extends BusinessException {

	public ForbiddenException(ErrorCode errorCode) {
		super(errorCode);
	}

	public ForbiddenException(ErrorCode errorCode, String message) {
		super(errorCode, message);
	}
}
