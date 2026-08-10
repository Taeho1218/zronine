package com.gonggu.community.global.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 모든 컨트롤러가 동일한 형태로 응답하도록 감싸는 공통 래퍼.
 * 프론트가 성공/실패를 HTTP 상태코드 파싱 없이 success 플래그 하나로 분기할 수 있게 하려는 목적이다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

	private final boolean success;
	private final String message;
	private final T data;
	private final String errorCode;

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, null, data, null);
	}

	public static <T> ApiResponse<T> success(T data, String message) {
		return new ApiResponse<>(true, message, data, null);
	}

	public static ApiResponse<Void> success() {
		return new ApiResponse<>(true, null, null, null);
	}

	public static ApiResponse<Void> error(String errorCode, String message) {
		return new ApiResponse<>(false, message, null, errorCode);
	}

	public static <T> ApiResponse<T> error(String errorCode, String message, T data) {
		return new ApiResponse<>(false, message, data, errorCode);
	}
}
