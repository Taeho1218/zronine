package com.gonggu.community.global.exception;

public class InvalidRequestException extends BusinessException {

	public InvalidRequestException(ErrorCode errorCode) {
		super(errorCode);
	}

	public InvalidRequestException(ErrorCode errorCode, String message) {
		super(errorCode, message);
	}
}
