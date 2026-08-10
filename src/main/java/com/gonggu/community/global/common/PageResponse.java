package com.gonggu.community.global.common;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Spring Data 의 Page 를 그대로 직렬화하면 내부 구조(pageable, sort 등)가 그대로 노출되고
 * 버전에 따라 JSON 형태가 바뀔 수 있어, 프론트가 의존할 최소 필드만 고정해서 내려준다.
 *
 * 무한 스크롤을 쓰는 화면이 있어 hasNext / nextPage 를 함께 담는다.
 * 클라이언트는 hasNext 가 true 인 동안 nextPage 를 그대로 다음 요청의 page 파라미터로 넘기면 되고,
 * 마지막 페이지에서는 nextPage 가 null 이라 더 요청할 게 없다는 것이 값 자체로 드러난다.
 */
@Getter
@AllArgsConstructor
public class PageResponse<T> {

	private final List<T> content;
	private final int page;
	private final int size;
	private final long totalElements;
	private final int totalPages;
	private final boolean first;
	private final boolean last;
	private final boolean hasNext;
	private final Integer nextPage;

	public static <T> PageResponse<T> from(Page<T> page) {
		return from(page, Function.identity());
	}

	public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
		boolean hasNext = page.hasNext();
		return new PageResponse<>(
			page.getContent().stream().map(mapper).toList(),
			page.getNumber(),
			page.getSize(),
			page.getTotalElements(),
			page.getTotalPages(),
			page.isFirst(),
			page.isLast(),
			hasNext,
			hasNext ? page.getNumber() + 1 : null
		);
	}
}
