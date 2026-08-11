package com.gonggu.community.global.upload;

/**
 * Presigned URL 발급 응답.
 *
 * 프론트는 uploadUrl 로 파일을 "직접" PUT 하고(우리 서버를 거치지 않음),
 * 업로드가 끝나면 별도 확인 호출 없이 publicUrl 을 그대로 게시글의 imageUrls 에 담아 쓰면 된다.
 * requiredContentType 은 PUT 요청 헤더의 Content-Type과 정확히 일치해야 한다 —
 * 서명에 Content-Type이 포함되어 있어 다르면 R2가 서명 불일치로 요청을 거부한다.
 */
public record PresignedUploadResponse(
	String uploadUrl,
	String publicUrl,
	String requiredContentType,
	long expiresInSeconds
) {
}
