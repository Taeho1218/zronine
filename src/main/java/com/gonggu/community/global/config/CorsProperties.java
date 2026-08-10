package com.gonggu.community.global.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {

	/** React 개발 서버 등 허용할 Origin 목록. 와일드카드(*)는 쓰지 않는다. */
	private final List<String> allowedOrigins;
}
