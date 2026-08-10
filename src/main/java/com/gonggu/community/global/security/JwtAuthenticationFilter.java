package com.gonggu.community.global.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Authorization: Bearer &lt;accessToken&gt; 헤더를 읽어 SecurityContext 를 채운다.
 *
 * 토큰이 없거나 유효하지 않아도 여기서 응답을 끊지 않고 그냥 통과시킨다.
 * 인증 없이도 볼 수 있는 API(메인 피드, 게시글 상세)가 있고,
 * 실제 차단 여부는 SecurityConfig 의 인가 규칙과 JwtAuthenticationEntryPoint 가 결정해야 하기 때문이다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;
	private final CustomUserDetailsService userDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {

		String token = jwtTokenProvider.resolveToken(request);

		if (token != null && jwtTokenProvider.isValid(token, TokenType.ACCESS)
			&& SecurityContextHolder.getContext().getAuthentication() == null) {
			try {
				UserDetails userDetails = userDetailsService.loadUserById(jwtTokenProvider.getUserId(token));
				// 토큰 발급 이후 탈퇴한 계정이라면 남은 토큰으로 계속 접근할 수 있으면 안 된다.
				if (userDetails.isEnabled()) {
					UsernamePasswordAuthenticationToken authentication =
						new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
					authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			} catch (Exception e) {
				log.debug("토큰으로 인증 정보를 만들지 못했습니다: {}", e.getMessage());
				SecurityContextHolder.clearContext();
			}
		}

		filterChain.doFilter(request, response);
	}
}
