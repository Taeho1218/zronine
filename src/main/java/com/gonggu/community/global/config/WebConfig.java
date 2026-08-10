package com.gonggu.community.global.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.gonggu.community.global.upload.UploadProperties;

import lombok.RequiredArgsConstructor;

/**
 * LocalImageUploadService 가 디스크에 저장한 이미지를 브라우저가 바로 불러올 수 있게 노출한다.
 * S3 로 교체되면 이미지 URL 이 외부 도메인이 되므로 이 핸들러는 제거해도 된다.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final UploadProperties uploadProperties;

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		Path uploadDir = Paths.get(uploadProperties.getLocation()).toAbsolutePath().normalize();
		registry.addResourceHandler(uploadProperties.getUrlPrefix() + "/**")
			.addResourceLocations(uploadDir.toUri().toString());
	}
}
