package com.gonggu.community.global.upload;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 저장소를 추상화한다. {@link LocalImageUploadService}(로컬 개발)와
 * {@link R2ImageUploadService}(운영) 중 app.upload.provider 값에 따라 하나만 빈으로 뜨고,
 * 호출부(컨트롤러/서비스)는 이 인터페이스에만 의존한다.
 */
public interface ImageUploadService {

	/**
	 * 파일을 서버가 대신 받아서 저장소에 올린다(프록시 업로드).
	 * @return 저장된 이미지에 접근할 수 있는 URL (로컬 구현은 /images/... 형태의 상대 경로)
	 */
	String upload(MultipartFile file);

	List<String> uploadAll(List<MultipartFile> files);

	/**
	 * 저장된 이미지를 제거한다. 이미 없는 파일이면 조용히 무시한다.
	 */
	void delete(String imageUrl);

	/**
	 * 클라이언트가 파일을 저장소에 "직접" 업로드할 수 있는 사전 서명 URL을 발급한다.
	 * 업로드되는 파일 바이트가 우리 서버를 거치지 않아 대용량/동시 업로드에도 서버 부하가 없다.
	 * 서명 기반 접근을 지원하지 않는 구현체(Local)는 UnsupportedOperationException 계열 예외를 던진다.
	 */
	PresignedUploadResponse presign(PresignUploadRequest request);
}
