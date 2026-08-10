package com.gonggu.community.global.upload;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gonggu.community.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

/**
 * 글 작성 화면에서 이미지를 먼저 업로드해 URL 을 받아두고,
 * 게시글 저장 요청에는 그 URL 목록만 실어 보내도록 분리했다. (게시글 저장과 파일 전송을 한 요청에 묶지 않음)
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class ImageUploadController {

	private final ImageUploadService imageUploadService;

	@PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<String> uploadImage(@RequestPart("file") MultipartFile file) {
		return ApiResponse.success(imageUploadService.upload(file));
	}

	@PostMapping(value = "/images/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<List<String>> uploadImages(@RequestPart("files") List<MultipartFile> files) {
		return ApiResponse.success(imageUploadService.uploadAll(files));
	}
}
