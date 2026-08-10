package com.gonggu.community.global.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.gonggu.community.global.common.ApiResponse;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * 컨트롤러마다 try-catch 를 반복하지 않도록 예외를 한곳에서 ApiResponse 형태로 변환한다.
 * 프론트 입장에서는 성공이든 실패든 응답 스키마가 같아야 파싱 분기가 단순해진다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
		ErrorCode errorCode = e.getErrorCode();
		return ResponseEntity.status(errorCode.getHttpStatus())
			.body(ApiResponse.error(errorCode.name(), e.getMessage()));
	}

	/**
	 * @Valid 실패는 어떤 필드가 왜 틀렸는지 프론트가 폼에 그대로 표시할 수 있어야 하므로
	 * 필드명-메시지 맵을 data 에 담아 함께 내려준다.
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException e) {
		Map<String, String> fieldErrors = new LinkedHashMap<>();
		for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
			fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
		}
		return ResponseEntity.status(ErrorCode.INVALID_INPUT.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.INVALID_INPUT.name(), ErrorCode.INVALID_INPUT.getDefaultMessage(), fieldErrors));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException e) {
		return ResponseEntity.status(ErrorCode.INVALID_INPUT.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.INVALID_INPUT.name(), e.getMessage()));
	}

	@ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
	public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception e) {
		return ResponseEntity.status(ErrorCode.INVALID_INPUT.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.INVALID_INPUT.name(), e.getMessage()));
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
		return ResponseEntity.status(ErrorCode.METHOD_NOT_ALLOWED.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.METHOD_NOT_ALLOWED.name(), e.getMessage()));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(MaxUploadSizeExceededException e) {
		return ResponseEntity.status(ErrorCode.FILE_TOO_LARGE.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.FILE_TOO_LARGE.name(), ErrorCode.FILE_TOO_LARGE.getDefaultMessage()));
	}

	/**
	 * Spring Security 의 인가 실패는 필터 이후 단계(메서드 보안 등)에서도 발생할 수 있어
	 * 여기서도 동일한 응답 포맷으로 맞춰준다.
	 */
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
			.body(ApiResponse.error(ErrorCode.FORBIDDEN.name(), ErrorCode.FORBIDDEN.getDefaultMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception e) {
		log.error("처리되지 않은 예외 발생", e);
		return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getHttpStatus())
			.body(ApiResponse.error(ErrorCode.INTERNAL_ERROR.name(), ErrorCode.INTERNAL_ERROR.getDefaultMessage()));
	}
}
