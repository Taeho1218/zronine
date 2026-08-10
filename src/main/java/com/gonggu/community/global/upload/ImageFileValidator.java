package com.gonggu.community.global.upload;

import java.util.Locale;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;

/**
 * 업로드 파일 검증 로직. Local/R2 등 저장소 구현체가 늘어나도 검증 기준은 하나여야 하므로
 * ImageUploadService 구현체마다 중복하지 않고 여기 모아둔다.
 *
 * MIME 타입과 확장자를 모두 본다. Content-Type 헤더는 클라이언트가 자유롭게 조작할 수 있고,
 * 확장자만 보면 image/svg+xml 같은 스크립트 실행 가능 포맷을 걸러내지 못하기 때문이다.
 */
final class ImageFileValidator {

	private static final Set<String> ALLOWED_CONTENT_TYPES =
		Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

	private static final Set<String> ALLOWED_EXTENSIONS =
		Set.of("jpg", "jpeg", "png", "gif", "webp");

	private ImageFileValidator() {
	}

	static void validate(MultipartFile file, long maxFileSizeBytes) {
		if (file == null || file.isEmpty()) {
			throw new InvalidRequestException(ErrorCode.EMPTY_FILE);
		}
		if (file.getSize() > maxFileSizeBytes) {
			throw new InvalidRequestException(ErrorCode.FILE_TOO_LARGE);
		}
		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new InvalidRequestException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
		}
		if (!ALLOWED_EXTENSIONS.contains(resolveExtension(file.getOriginalFilename()))) {
			throw new InvalidRequestException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
		}
	}

	/**
	 * 파일명은 클라이언트가 보낸 이름을 그대로 쓰지 않고 UUID로 새로 만든다.
	 * 원본 파일명에는 경로 조작 문자(../)나 중복 이름이 섞일 수 있기 때문이다.
	 * 확장자만 이 메서드로 뽑아서 새 파일명 뒤에 붙인다.
	 */
	static String resolveExtension(String originalFilename) {
		if (originalFilename == null) {
			return "";
		}
		int dotIndex = originalFilename.lastIndexOf('.');
		if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
			return "";
		}
		return originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
	}
}
