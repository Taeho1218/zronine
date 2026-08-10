package com.gonggu.community.global.upload;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Cloudflare R2 접속 정보. app.upload.provider=r2 일 때만 R2ImageUploadService 에서 쓰인다.
 */
@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "r2")
public class R2Properties {

	/** https://&lt;account_id&gt;.r2.cloudflarestorage.com 형태의 S3 호환 엔드포인트 */
	private final String endpoint;

	private final String bucket;

	private final String accessKeyId;

	private final String secretAccessKey;

	/** 업로드된 객체를 외부에서 접근할 때 쓰는 기본 URL (퍼블릭 개발 URL 또는 커스텀 도메인) */
	private final String publicBaseUrl;
}
