package com.gonggu.community.global.upload;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {

	/** 파일이 실제로 저장될 물리 경로 */
	private final String location;

	/** 저장된 파일을 외부에 노출할 URL prefix */
	private final String urlPrefix;

	/** 백엔드에서 직접 막는 파일 크기 상한 (멀티파트 설정과 별개로 서비스 레벨에서도 검증) */
	private final long maxFileSizeBytes;
}
