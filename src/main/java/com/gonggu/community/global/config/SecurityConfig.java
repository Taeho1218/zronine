package com.gonggu.community.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.gonggu.community.global.security.JwtAccessDeniedHandler;
import com.gonggu.community.global.security.JwtAuthenticationEntryPoint;
import com.gonggu.community.global.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

/**
 * JWT 기반 무상태(Stateless) 인증 구성.
 *
 * - 세션을 쓰지 않으므로 CSRF 토큰도 의미가 없어 비활성화한다. (토큰은 쿠키가 아니라 헤더로 전달)
 * - 메인 피드/게시글 상세/카테고리 조회는 비로그인 사용자도 봐야 하므로 GET 일부를 permitAll 로 연다.
 *   단, 저장/좋아요/알림/댓글 작성처럼 "누가" 했는지가 필요한 요청은 모두 인증을 요구한다.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
	private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
	private final CorsConfigurationSource corsConfigurationSource;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.cors(cors -> cors.configurationSource(corsConfigurationSource))
			.csrf(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.exceptionHandling(handler -> handler
				.authenticationEntryPoint(jwtAuthenticationEntryPoint)
				.accessDeniedHandler(jwtAccessDeniedHandler))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/api/auth/**").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/users/check-email", "/api/users/check-nickname").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/*").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/posts/*/comments", "/api/posts/*/similar").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/users/*", "/api/users/*/posts",
					"/api/users/*/followers", "/api/users/*/followings").permitAll()
				.requestMatchers("/images/**", "/error").permitAll()
				.anyRequest().authenticated())
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
