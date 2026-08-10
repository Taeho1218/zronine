package com.gonggu.community.global.exception;

public class NotFoundException extends BusinessException {

	public NotFoundException(ErrorCode errorCode) {
		super(errorCode);
	}

	public NotFoundException(ErrorCode errorCode, String message) {
		super(errorCode, message);
	}
}
