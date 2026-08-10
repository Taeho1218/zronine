package com.gonggu.community.domain.postcategory;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * post_categories 는 대리키 없이 (post_id, category_id) 복합키를 그대로 PK 로 쓴다.
 * 같은 글에 같은 카테고리가 두 번 붙는 것을 DB 레벨에서 막기 위한 구조라 @EmbeddedId 로 매핑한다.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostCategoryId implements Serializable {

	@Column(name = "post_id")
	private Long postId;

	@Column(name = "category_id")
	private Integer categoryId;

	public PostCategoryId(Long postId, Integer categoryId) {
		this.postId = postId;
		this.categoryId = categoryId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) {
			return true;
		}
		if (!(o instanceof PostCategoryId that)) {
			return false;
		}
		return Objects.equals(postId, that.postId) && Objects.equals(categoryId, that.categoryId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(postId, categoryId);
	}
}
