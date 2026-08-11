package com.gonggu.community.domain.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 회원가입 요청. 이메일이 곧 로그인 아이디다.
 *
 * passwordConfirm 은 DB 에 저장하지 않고 가입 시점 검증에만 쓰인다.
 * agreeToTerms 도 그 자체로는 저장하지 않는다. 동의 "여부"가 아니라 동의한 "시각"을
 * users.terms_agreed_at 에 남겨야 약관 개정 시 어느 버전에 동의한 회원인지 역추적할 수 있기 때문이다.
 */
public record SignUpRequest(

	@NotBlank(message = "이메일을 입력해주세요.")
	@Email(message = "이메일 형식이 올바르지 않습니다.")
	@Size(max = 255, message = "이메일은 255자를 넘을 수 없습니다.")
	String email,

	@NotBlank(message = "비밀번호를 입력해주세요.")
	@Size(min = 4, max = 64, message = "비밀번호는 4자 이상 64자 이하여야 합니다.")
	String password,

	@NotBlank(message = "비밀번호 확인을 입력해주세요.")
	String passwordConfirm,

	@NotBlank(message = "닉네임을 입력해주세요.")
	@Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하여야 합니다.")
	String nickname,

	@AssertTrue(message = "약관에 동의해야 가입할 수 있습니다.")
	boolean agreeToTerms
) {

	public boolean isPasswordConfirmed() {
		return password != null && password.equals(passwordConfirm);
	}
}
