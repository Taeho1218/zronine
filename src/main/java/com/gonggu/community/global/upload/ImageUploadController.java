package com.gonggu.community.global.upload;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.common.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 글 작성 화면에서 이미지를 먼저 업로드해 URL 을 받아두고,
 * 게시글 저장 요청에는 그 URL 목록만 실어 보내도록 분리했다. (게시글 저장과 파일 전송을 한 요청에 묶지 않음)
 *
 * /presign 이 기본 경로다 — 파일이 우리 서버를 거치지 않고 R2로 직접 올라가서 대용량/동시 업로드에도
 * 서버 부하가 없다. /images, /images/bulk 는 로컬 개발(provider=local)이나 presign을 못 쓰는
 * 상황을 위한 대체 경로로 남겨둔다.
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class ImageUploadController {

	private final ImageUploadService imageUploadService;

	@PostMapping("/presign")
	public ApiResponse<PresignedUploadResponse> presign(@Valid @RequestBody PresignUploadRequest request) {
		return ApiResponse.success(imageUploadService.presign(request));
	}

	@PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<String> uploadImage(@RequestPart("file") MultipartFile file) {
		return ApiResponse.success(imageUploadService.upload(file));
	}

	@PostMapping(value = "/images/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<List<String>> uploadImages(@RequestPart("files") List<MultipartFile> files) {
		return ApiResponse.success(imageUploadService.uploadAll(files));
	}
}
