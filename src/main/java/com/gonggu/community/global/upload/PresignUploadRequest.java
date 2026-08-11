package com.gonggu.community.global.upload;

import jakarta.validation.constraints.NotBlank;

/**
 * Presigned URL 발급 요청. 이 시점엔 파일 바이트가 아직 서버로 오지 않으므로
 * fileName(확장자 판별용)과 contentType만으로 사전 검증한다.
 */
public record PresignUploadRequest(

	@NotBlank(message = "파일 이름이 필요합니다.")
	String fileName,

	@NotBlank(message = "Content-Type이 필요합니다.")
	String contentType
) {
}
