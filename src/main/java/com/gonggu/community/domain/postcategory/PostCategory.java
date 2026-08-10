package com.gonggu.community.domain.postcategory;

import com.gonggu.community.domain.category.Category;
import com.gonggu.community.domain.post.Post;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 셀러글이 카테고리를 1개 이상 다중 선택하는 N:M 매핑 테이블.
 */
@Entity
@Table(name = "post_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostCategory {

	@EmbeddedId
	private PostCategoryId id;

	@MapsId("postId")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@MapsId("categoryId")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "category_id", nullable = false)
	private Category category;

	public PostCategory(Post post, Category category) {
		this.id = new PostCategoryId(post.getId(), category.getId());
		this.post = post;
		this.category = category;
	}
}
