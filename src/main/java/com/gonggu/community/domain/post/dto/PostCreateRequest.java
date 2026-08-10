package com.gonggu.community.domain.post.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.gonggu.community.domain.post.PostType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 글 작성 요청.
 *
 * 셀러 전용 필드(사진/기간/물건이름/가격/구매링크/카테고리)에는 @NotNull 을 붙이지 않는다.
 * 일반글에서는 그 값들이 비어 있는 게 정상이라, "SELLER 일 때만 필수"라는 조건부 규칙은
 * Bean Validation 이 아니라 PostService 에서 postType 을 보고 검증한다.
 */
public record PostCreateRequest(

	@NotNull(message = "글 종류를 선택해주세요.")
	PostType postType,

	@NotBlank(message = "제목을 입력해주세요.")
	@Size(max = 255, message = "제목은 255자를 넘을 수 없습니다.")
	String title,

	@NotBlank(message = "상세내용을 입력해주세요.")
	String content,

	List<String> imageUrls,

	@Size(max = 100, message = "물건 이름은 100자를 넘을 수 없습니다.")
	String productName,

	@PositiveOrZero(message = "가격은 0 이상이어야 합니다.")
	BigDecimal price,

	@Size(max = 512, message = "구매링크가 너무 깁니다.")
	String buyUrl,

	LocalDateTime startDate,

	LocalDateTime endDate,

	@Size(max = 255, message = "이벤트 내용은 255자를 넘을 수 없습니다.")
	String eventNote,

	List<Integer> categoryIds
) {
}
