package com.gonggu.community.global.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 파일시스템 기반 임시 구현체.
 *
 * S3/R2 로 교체 예정 — 자격증명 설정이 끝나면 S3ImageUploadService 구현체를 추가하고
 * 이 클래스에서 @Service 를 떼거나 @Primary 로 새 구현체를 우선시키면 된다.
 * 호출부는 ImageUploadService 인터페이스만 보고 있으므로 코드 변경 없이 교체된다.
 *
 * 파일명은 클라이언트가 보낸 이름을 그대로 쓰지 않고 UUID 로 새로 만든다.
 * 원본 파일명에는 경로 조작 문자(../)나 중복 이름이 섞일 수 있기 때문이다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocalImageUploadService implements ImageUploadService {

	private static final Set<String> ALLOWED_CONTENT_TYPES =
		Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

	private static final Set<String> ALLOWED_EXTENSIONS =
		Set.of("jpg", "jpeg", "png", "gif", "webp");

	private static final DateTimeFormatter DATE_DIR_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

	private final UploadProperties uploadProperties;

	private Path rootLocation;

	@PostConstruct
	void initStorage() {
		this.rootLocation = Paths.get(uploadProperties.getLocation()).toAbsolutePath().normalize();
		try {
			Files.createDirectories(rootLocation);
		} catch (IOException e) {
			throw new IllegalStateException("업로드 디렉터리를 생성할 수 없습니다: " + rootLocation, e);
		}
	}

	@Override
	public String upload(MultipartFile file) {
		validate(file);

		String extension = resolveExtension(file.getOriginalFilename());
		String relativeDir = LocalDate.now().format(DATE_DIR_FORMAT);
		String storedFileName = UUID.randomUUID().toString().replace("-", "") + "." + extension;

		Path targetDir = rootLocation.resolve(relativeDir).normalize();
		try {
			Files.createDirectories(targetDir);
			try (InputStream in = file.getInputStream()) {
				Files.copy(in, targetDir.resolve(storedFileName), StandardCopyOption.REPLACE_EXISTING);
			}
		} catch (IOException e) {
			log.error("이미지 저장 실패: {}", file.getOriginalFilename(), e);
			throw new com.gonggu.community.global.exception.BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
		}

		return uploadProperties.getUrlPrefix() + "/" + relativeDir + "/" + storedFileName;
	}

	@Override
	public List<String> uploadAll(List<MultipartFile> files) {
		if (files == null || files.isEmpty()) {
			throw new InvalidRequestException(ErrorCode.EMPTY_FILE);
		}
		return files.stream().map(this::upload).toList();
	}

	@Override
	public void delete(String imageUrl) {
		if (imageUrl == null || !imageUrl.startsWith(uploadProperties.getUrlPrefix() + "/")) {
			return;
		}
		String relativePath = imageUrl.substring(uploadProperties.getUrlPrefix().length() + 1);
		Path target = rootLocation.resolve(relativePath).normalize();

		// 정규화 후에도 루트 밖을 가리키면 경로 조작 시도이므로 삭제하지 않는다.
		if (!target.startsWith(rootLocation)) {
			log.warn("업로드 루트를 벗어난 삭제 요청 무시: {}", imageUrl);
			return;
		}
		try {
			Files.deleteIfExists(target);
		} catch (IOException e) {
			log.warn("이미지 삭제 실패: {}", imageUrl, e);
		}
	}

	/**
	 * MIME 타입과 확장자를 모두 본다. Content-Type 헤더는 클라이언트가 자유롭게 조작할 수 있고,
	 * 확장자만 보면 image/svg+xml 같은 스크립트 실행 가능 포맷을 걸러내지 못하기 때문이다.
	 */
	private void validate(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new InvalidRequestException(ErrorCode.EMPTY_FILE);
		}
		if (file.getSize() > uploadProperties.getMaxFileSizeBytes()) {
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

	private String resolveExtension(String originalFilename) {
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
