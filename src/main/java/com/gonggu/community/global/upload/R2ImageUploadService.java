package com.gonggu.community.global.upload;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.List;

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
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

/**
 * Cloudflare R2(오브젝트 스토리지) 구현체. R2는 S3 호환 API를 제공하므로 AWS SDK의 S3Client를
 * 엔드포인트만 R2로 바꿔서 그대로 쓸 수 있다.
 *
 * Render 같은 PaaS는 컨테이너 디스크가 재배포/재시작마다 초기화돼서 LocalImageUploadService로
 * 저장한 파일이 배포할 때마다 사라진다. 그래서 운영 환경(app.upload.provider=r2)에서는
 * 이 구현체가 대신 활성화되도록 설정한다. 호출부는 ImageUploadService 인터페이스만 보고 있어서
 * 프로퍼티만 바꾸면 코드 변경 없이 로컬 ↔ R2 가 교체된다.
 *
 * upload()/uploadAll()은 파일이 우리 서버를 거쳐서 R2로 가는 프록시 방식이라 동시/대용량 업로드에
 * 서버 부하가 생긴다. 그래서 실제 트래픽이 몰릴 수 있는 글쓰기 화면은 presign()으로 발급한
 * URL에 프론트가 R2로 직접 PUT 하도록 유도한다(우리 서버는 바이트를 한 번도 안 본다).
 * 프록시 메서드는 남겨두되 대체 경로 정도로만 취급한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.upload", name = "provider", havingValue = "r2")
public class R2ImageUploadService implements ImageUploadService {

	/** presigned URL 유효 시간. 너무 길면 유출된 URL이 오래 악용될 수 있어 업로드 한 번 하기에 충분한 선에서 짧게 잡는다. */
	private static final Duration PRESIGN_DURATION = Duration.ofMinutes(10);

	private final UploadProperties uploadProperties;
	private final R2Properties r2Properties;

	private S3Client s3Client;
	private S3Presigner s3Presigner;

	@PostConstruct
	void initClient() {
		AwsBasicCredentials credentials =
			AwsBasicCredentials.create(r2Properties.getAccessKeyId(), r2Properties.getSecretAccessKey());
		URI endpoint = URI.create(r2Properties.getEndpoint());
		// R2는 AWS 리전 개념이 없다. Cloudflare가 공식적으로 안내하는 고정값 "auto"를 쓴다.
		Region region = Region.of("auto");

		this.s3Client = S3Client.builder()
			.endpointOverride(endpoint)
			.region(region)
			.credentialsProvider(StaticCredentialsProvider.create(credentials))
			.forcePathStyle(true)
			.build();

		this.s3Presigner = S3Presigner.builder()
			.endpointOverride(endpoint)
			.region(region)
			.credentialsProvider(StaticCredentialsProvider.create(credentials))
			.build();
	}

	@PreDestroy
	void closeClient() {
		if (s3Client != null) {
			s3Client.close();
		}
		if (s3Presigner != null) {
			s3Presigner.close();
		}
	}

	@Override
	public String upload(MultipartFile file) {
		ImageFileValidator.validate(file, uploadProperties.getMaxFileSizeBytes());

		String key = ImageFileValidator.generateKey(file.getOriginalFilename());

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

	/**
	 * 파일 크기는 아직 알 수 없으므로(바이트가 아직 안 왔음) MIME 타입/확장자만 검증한다.
	 * 서명에 Content-Type이 포함되므로, 프론트는 실제 PUT 요청에서 반드시 같은 Content-Type
	 * 헤더를 보내야 한다 — 다르면 R2가 서명 불일치로 요청 자체를 거부한다.
	 */
	@Override
	public PresignedUploadResponse presign(PresignUploadRequest request) {
		ImageFileValidator.validateMeta(request.contentType(), request.fileName());

		String key = ImageFileValidator.generateKey(request.fileName());

		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
			.bucket(r2Properties.getBucket())
			.key(key)
			.contentType(request.contentType())
			.build();

		PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(builder -> builder
			.signatureDuration(PRESIGN_DURATION)
			.putObjectRequest(putObjectRequest));

		return new PresignedUploadResponse(
			presignedRequest.url().toString(),
			r2Properties.getPublicBaseUrl() + "/" + key,
			request.contentType(),
			PRESIGN_DURATION.toSeconds()
		);
	}
}
