package com.gonggu.community.domain.category;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.category.dto.CategoryCreateRequest;
import com.gonggu.community.domain.category.dto.CategoryResponse;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

	private final CategoryRepository categoryRepository;

	/** 메인 페이지 카테고리 필터와 글 작성 화면의 카테고리 선택지가 같은 순서로 보이도록 id 오름차순으로 고정한다. */
	public List<CategoryResponse> getAll() {
		return categoryRepository.findAllByOrderByIdAsc().stream()
			.map(CategoryResponse::from)
			.toList();
	}

	@Transactional
	public CategoryResponse create(CategoryCreateRequest request) {
		if (categoryRepository.existsByName(request.name())) {
			throw new DuplicateResourceException(ErrorCode.CATEGORY_DUPLICATED);
		}
		return CategoryResponse.from(categoryRepository.save(new Category(request.name())));
	}

	public List<Category> findAllByIdsOrThrow(List<Integer> categoryIds) {
		List<Category> categories = categoryRepository.findAllById(categoryIds);
		// 존재하지 않는 id 가 섞여 있으면 조용히 무시하지 말고 알려준다. (프론트가 잘못된 선택지를 계속 보여주는 것을 막기 위함)
		if (categories.size() != categoryIds.size()) {
			throw new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
		}
		return categories;
	}
}
