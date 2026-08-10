package com.gonggu.community.domain.category;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

	boolean existsByName(String name);

	List<Category> findAllByOrderByIdAsc();
}
