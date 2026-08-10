package com.gonggu.community.global.upload;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.exception.BusinessException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * Cloudflare R2(오브젝트 스토리지) 구현체. R2는 S3 호환 API를 제공하므로 AWS SDK의 S3Client를
 * 엔드포인트만 R2로 바꿔서 그대로 쓸 수 있다.
 *
 * Render 같은 PaaS는 컨테이너 디스크가 재배포/재시작마다 초기화돼서 LocalImageUploadService로
 * 저장한 파일이 배포할 때마다 사라진다. 그래서 운영 환경(app.upload.provider=r2)에서는
 * 이 구현체가 대신 활성화되도록 설정한다. 호출부는 ImageUploadService 인터페이스만 보고 있어서
 * 프로퍼티만 바꾸면 코드 변경 없이 로컬 ↔ R2 가 교체된다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.upload", name = "provider", havingValue = "r2")
public class R2ImageUploadService implements ImageUploadService {

	private static final DateTimeFormatter DATE_DIR_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

	private final UploadProperties uploadProperties;
	private final R2Properties r2Properties;

	private S3Client s3Client;

	@PostConstruct
	void initClient() {
		this.s3Client = S3Client.builder()
			.endpointOverride(URI.create(r2Properties.getEndpoint()))
			// R2는 AWS 리전 개념이 없다. Cloudflare가 공식적으로 안내하는 고정값 "auto"를 쓴다.
			.region(Region.of("auto"))
			.credentialsProvider(StaticCredentialsProvider.create(
				AwsBasicCredentials.create(r2Properties.getAccessKeyId(), r2Properties.getSecretAccessKey())))
			.forcePathStyle(true)
			.build();
	}

	@PreDestroy
	void closeClient() {
		if (s3Client != null) {
			s3Client.close();
		}
	}

	@Override
	public String upload(MultipartFile file) {
		ImageFileValidator.validate(file, uploadProperties.getMaxFileSizeBytes());

		String extension = ImageFileValidator.resolveExtension(file.getOriginalFilename());
		String relativeDir = LocalDate.now().format(DATE_DIR_FORMAT);
		String key = relativeDir + "/" + UUID.randomUUID().toString().replace("-", "") + "." + extension;

		try (InputStream in = file.getInputStream()) {
			s3Client.putObject(
				PutObjectRequest.builder()
					.bucket(r2Properties.getBucket())
					.key(key)
					.contentType(file.getContentType())
					.build(),
				RequestBody.fromInputStream(in, file.getSize())
			);
		} catch (IOException e) {
			log.error("R2 업로드 실패: {}", file.getOriginalFilename(), e);
			throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
		}

		return r2Properties.getPublicBaseUrl() + "/" + key;
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
		String prefix = r2Properties.getPublicBaseUrl() + "/";
		if (imageUrl == null || !imageUrl.startsWith(prefix)) {
			return;
		}
		String key = imageUrl.substring(prefix.length());
		try {
			s3Client.deleteObject(DeleteObjectRequest.builder()
				.bucket(r2Properties.getBucket())
				.key(key)
				.build());
		} catch (Exception e) {
			log.warn("R2 이미지 삭제 실패: {}", imageUrl, e);
		}
	}
}
