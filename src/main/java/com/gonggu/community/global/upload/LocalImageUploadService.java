package com.gonggu.community.global.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.exception.BusinessException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 파일시스템 기반 구현체. 로컬 개발 환경의 기본값이다(app.upload.provider 미설정 시 이 빈이 뜬다).
 *
 * Render처럼 컨테이너 디스크가 재배포/재시작마다 초기화되는 환경에 그대로 쓰면 업로드된 이미지가
 * 전부 사라지므로, 운영 배포에서는 반드시 R2ImageUploadService(app.upload.provider=r2)를 써야 한다.
 * 호출부는 ImageUploadService 인터페이스만 보고 있으므로 프로퍼티 값만 바꾸면 코드 변경 없이 교체된다.
 *
 * presign()은 지원하지 않는다 — 로컬 개발 서버는 "많은 사용자가 동시에 올려서 서버가 무리 간다"는
 * 문제가 애초에 없는 환경이라, 사전 서명 URL 대신 기존 프록시 업로드(upload/uploadAll)만으로 충분하다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.upload", name = "provider", havingValue = "local", matchIfMissing = true)
public class LocalImageUploadService implements ImageUploadService {

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
		ImageFileValidator.validate(file, uploadProperties.getMaxFileSizeBytes());

		String key = ImageFileValidator.generateKey(file.getOriginalFilename());
		Path target = rootLocation.resolve(key).normalize();
		try {
			Files.createDirectories(target.getParent());
			try (InputStream in = file.getInputStream()) {
				Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
			}
		} catch (IOException e) {
			log.error("이미지 저장 실패: {}", file.getOriginalFilename(), e);
			throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
		}

		return uploadProperties.getUrlPrefix() + "/" + key;
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

	@Override
	public PresignedUploadResponse presign(PresignUploadRequest request) {
		throw new InvalidRequestException(ErrorCode.PRESIGN_NOT_SUPPORTED,
			"로컬 개발 환경에서는 사전 서명 URL을 지원하지 않습니다. /api/uploads/images 를 사용하세요.");
	}
}
