package com.gonggu.community.domain.user;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gonggu.community.domain.follow.FollowRepository;
import com.gonggu.community.domain.post.PostRepository;
import com.gonggu.community.domain.user.dto.LoginRequest;
import com.gonggu.community.domain.user.dto.NicknameCheckResponse;
import com.gonggu.community.domain.user.dto.SignUpRequest;
import com.gonggu.community.domain.user.dto.TokenReissueRequest;
import com.gonggu.community.domain.user.dto.TokenResponse;
import com.gonggu.community.domain.user.dto.UserProfileResponse;
import com.gonggu.community.domain.user.dto.UserSummaryResponse;
import com.gonggu.community.domain.user.dto.UserUpdateRequest;
import com.gonggu.community.domain.user.dto.WithdrawResponse;
import com.gonggu.community.global.exception.DuplicateResourceException;
import com.gonggu.community.global.exception.ErrorCode;
import com.gonggu.community.global.exception.InvalidRequestException;
import com.gonggu.community.global.exception.NotFoundException;
import com.gonggu.community.global.exception.UnauthorizedException;
import com.gonggu.community.global.security.JwtTokenProvider;
import com.gonggu.community.global.security.TokenType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

	/** 탈퇴 후 계정을 실제로 지우기까지의 유예 기간. 안내 문구와 배치 잡이 같은 값을 공유해야 한다. */
	public static final int WITHDRAW_RETENTION_DAYS = 30;

	private final UserRepository userRepository;
	private final FollowRepository followRepository;
	private final PostRepository postRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;

	/**
	 * 이메일/닉네임은 DB UNIQUE 로도 막히지만, 그때는 어떤 필드가 겹쳤는지 알 수 없는 예외만 올라온다.
	 * 프론트가 필드별 에러를 표시할 수 있도록 저장 전에 각각 확인해 별도 에러 코드를 던진다.
	 */
	@Transactional
	public UserSummaryResponse signUp(SignUpRequest request) {
		if (!request.isPasswordConfirmed()) {
			throw new InvalidRequestException(ErrorCode.INVALID_INPUT, "비밀번호와 비밀번호 확인이 일치하지 않습니다.");
		}
		// @AssertTrue 로도 걸리지만, 약관 미동의 가입은 반드시 막아야 하는 규칙이라
		// Bean Validation 이 비활성화되거나 서비스가 직접 호출되는 경우에도 통과하지 않도록 여기서 한 번 더 막는다.
		if (!request.agreeToTerms()) {
			throw new InvalidRequestException(ErrorCode.TERMS_NOT_AGREED);
		}
		if (userRepository.existsByEmail(request.email())) {
			throw new DuplicateResourceException(ErrorCode.EMAIL_DUPLICATED);
		}
		if (userRepository.existsByNickname(request.nickname())) {
			throw new DuplicateResourceException(ErrorCode.NICKNAME_DUPLICATED);
		}

		// 위에서 약관 동의를 이미 검증했으므로, 동의 시각은 가입 처리 시점으로 남긴다.
		User user = User.builder()
			.email(request.email())
			.password(passwordEncoder.encode(request.password()))
			.nickname(request.nickname())
			.termsAgreedAt(LocalDateTime.now())
			.build();

		return UserSummaryResponse.from(userRepository.save(user));
	}

	/**
	 * 이메일이 없는 경우와 비밀번호가 틀린 경우를 같은 에러로 응답한다.
	 * 응답을 구분하면 어떤 이메일이 가입돼 있는지 외부에서 알아낼 수 있기 때문이다.
	 */
	public TokenResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.email())
			.orElseThrow(() -> new UnauthorizedException(ErrorCode.LOGIN_FAILED));

		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new UnauthorizedException(ErrorCode.LOGIN_FAILED);
		}
		// 탈퇴 유예 상태의 계정은 로그인 자체를 막는다.
		if (!user.isActive()) {
			throw new UnauthorizedException(ErrorCode.WITHDRAWN_USER);
		}

		return issueTokens(user);
	}

	/**
	 * Access Token 이 만료됐을 때 Refresh Token 으로 새 토큰 쌍을 발급한다.
	 * Access Token 을 이 API 에 보내도 통하지 않도록 토큰 타입을 검사한다.
	 */
	public TokenResponse reissue(TokenReissueRequest request) {
		Long userId = jwtTokenProvider.parseUserIdOrThrow(request.refreshToken(), TokenType.REFRESH);

		User user = userRepository.findById(userId)
			.orElseThrow(() -> new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN));
		if (!user.isActive()) {
			throw new UnauthorizedException(ErrorCode.WITHDRAWN_USER);
		}

		return issueTokens(user);
	}

	private TokenResponse issueTokens(User user) {
		return TokenResponse.of(
			jwtTokenProvider.createAccessToken(user.getId(), user.getEmail()),
			jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail()),
			jwtTokenProvider.getAccessTokenValiditySeconds(),
			UserSummaryResponse.from(user)
		);
	}

	public NicknameCheckResponse checkEmailAvailable(String email) {
		return new NicknameCheckResponse(email, !userRepository.existsByEmail(email));
	}

	public NicknameCheckResponse checkNicknameAvailable(String nickname) {
		return new NicknameCheckResponse(nickname, !userRepository.existsByNickname(nickname));
	}

	public UserProfileResponse getProfile(Long targetUserId, Long viewerId) {
		User target = getUserOrThrow(targetUserId);

		boolean me = targetUserId.equals(viewerId);
		// 본인 프로필에는 팔로우 버튼이 없으므로 조회 자체를 생략한다.
		boolean following = !me && viewerId != null
			&& followRepository.existsByFollowerIdAndFollowingId(viewerId, targetUserId);

		return UserProfileResponse.of(
			target,
			followRepository.countByFollowingId(targetUserId),
			followRepository.countByFollowerId(targetUserId),
			postRepository.countByUserId(targetUserId),
			following,
			me
		);
	}

	/**
	 * 닉네임은 중복체크를 통과해야만 바꿀 수 있다.
	 * 자기 자신의 현재 닉네임은 중복으로 보지 않도록 본인 id 를 제외하고 확인한다.
	 */
	@Transactional
	public UserProfileResponse updateProfile(Long userId, UserUpdateRequest request) {
		User user = getUserOrThrow(userId);

		if (request.nickname() != null && !request.nickname().equals(user.getNickname())) {
			if (userRepository.existsByNicknameAndIdNot(request.nickname(), userId)) {
				throw new DuplicateResourceException(ErrorCode.NICKNAME_DUPLICATED);
			}
			user.changeNickname(request.nickname());
		}

		if (request.profileImageUrl() != null) {
			// 빈 문자열은 "기본 이미지로 되돌리기" 요청으로 해석한다.
			user.changeProfileImageUrl(request.profileImageUrl().isBlank() ? null : request.profileImageUrl());
		}

		return getProfile(userId, userId);
	}

	/**
	 * 회원 탈퇴는 즉시 삭제하지 않는다.
	 * 이 회원의 게시글/댓글이 다른 사용자 화면에 FK 로 물려 있고, 30일 안에는 복구할 수 있어야 하므로
	 * status 를 PENDING_DELETE 로 바꾸고 deleted_at 만 기록한다. (실제 물리 삭제는 배치 잡의 책임)
	 */
	@Transactional
	public WithdrawResponse withdraw(Long userId) {
		User user = getUserOrThrow(userId);
		if (!user.isActive()) {
			throw new InvalidRequestException(ErrorCode.WITHDRAWN_USER, "이미 탈퇴 처리된 계정입니다.");
		}

		user.withdraw();
		LocalDateTime deletedAt = user.getDeletedAt();

		return new WithdrawResponse(
			deletedAt,
			deletedAt.plusDays(WITHDRAW_RETENTION_DAYS),
			WITHDRAW_RETENTION_DAYS
		);
	}

	public User getUserOrThrow(Long userId) {
		return userRepository.findById(userId)
			.orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
	}
}
