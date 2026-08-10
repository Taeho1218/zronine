package com.gonggu.community.global.upload;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 저장소를 추상화한다.
 * 현재는 S3 자격증명이 없어 {@link LocalImageUploadService} 로 로컬 디스크에 저장하지만,
 * 나중에 S3/R2 자격증명이 준비되면 S3ImageUploadService 구현체를 만들어 빈만 교체하면 되도록
 * 호출부(컨트롤러/서비스)는 이 인터페이스에만 의존하게 한다.
 */
public interface ImageUploadService {

	/**
	 * @return 저장된 이미지에 접근할 수 있는 URL (로컬 구현은 /images/... 형태의 상대 경로)
	 */
	String upload(MultipartFile file);

	List<String> uploadAll(List<MultipartFile> files);

	/**
	 * 저장된 이미지를 제거한다. 이미 없는 파일이면 조용히 무시한다.
	 */
	void delete(String imageUrl);
}
