package com.gonggu.community.domain.post.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 글 수정 요청. postType 은 받지 않는다.
 * 셀러글 <-> 일반글 전환을 허용하면 이미 달린 알림 신청이나 카테고리 매핑의 의미가 깨지기 때문에
 * 글 종류는 작성 시점에 고정한다.
 */
public record PostUpdateRequest(

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
