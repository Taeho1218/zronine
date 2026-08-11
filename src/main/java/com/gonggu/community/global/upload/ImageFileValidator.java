package com.gonggu.community.global.upload;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;

/**
 * 업로드 파일 검증/키 생성 로직. Local/R2 등 저장소 구현체가 늘어나도 기준은 하나여야 하므로
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

	private static final DateTimeFormatter DATE_DIR_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

	private ImageFileValidator() {
	}

	static void validate(MultipartFile file, long maxFileSizeBytes) {
		if (file == null || file.isEmpty()) {
			throw new InvalidRequestException(ErrorCode.EMPTY_FILE);
		}
		if (file.getSize() > maxFileSizeBytes) {
			throw new InvalidRequestException(ErrorCode.FILE_TOO_LARGE);
		}
		validateTypeAndExtension(file.getContentType(), file.getOriginalFilename());
	}

	/**
	 * Presigned URL 발급 시점엔 파일 바이트가 아직 없어 크기를 검증할 수 없다.
	 * MIME 타입/확장자만 여기서 걸러내고, 크기는 R2 버킷 자체의 제약이나 클라이언트 신뢰에 맡긴다
	 * (팀 프로젝트 규모에서 감수하기로 한 트레이드오프 — 이미지 저장 노션 문서에 명시).
	 */
	static void validateMeta(String contentType, String originalFilename) {
		validateTypeAndExtension(contentType, originalFilename);
	}

	private static void validateTypeAndExtension(String contentType, String originalFilename) {
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new InvalidRequestException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
		}
		if (!ALLOWED_EXTENSIONS.contains(resolveExtension(originalFilename))) {
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

	/** 날짜별 디렉터리 + UUID 파일명 형태의 저장 키를 만든다. Local/R2 구현체가 동일한 규칙을 쓴다. */
	static String generateKey(String originalFilename) {
		String extension = resolveExtension(originalFilename);
		String relativeDir = LocalDate.now().format(DATE_DIR_FORMAT);
		return relativeDir + "/" + UUID.randomUUID().toString().replace("-", "") + "." + extension;
	}
}
