// 8~20자, 대문자/소문자/숫자/특수문자(공백 제외) 각각 1개 이상
export const email_regexp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const password_regexp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,20}$/;


export const msg = {
    // 프론트 검증
    "required-email": "*이메일을 입력해주세요.",
    "invalid-email": "*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
    

    "required-password": "*비밀번호를 입력해주세요.",
    "invalid-password": "*비밀번호는 8~20자이며, 대문자/소문자/숫자/특수문자를 각각 최소 1개 포함해야 합니다.",

    "required-nickname": "*닉네임을 입력해주세요.",
    "no-whitespace-nickname": "*띄어쓰기를 없애주세요.",
    "max-length-nickname": "*닉네임은 최대 10자까지 가능합니다.",


    // 백엔드 검증
    "duplicate-email": "*중복된 이메일 입니다.",
    "duplicate-nickname": "*이미 사용 중인 닉네임입니다.",

    // 로그인 검증
    "wrong-login-info": "*이메일 또는 비밀번호가 올바르지 않습니다.",
    REQUIRED_INPUT: "*필수 입력값이 누락되었습니다.",

    // 회원가입 시 중복 비밀번호 검증 용도
    "password-confirm-mismatch": "*비밀번호가 일치하지 않습니다.",

    // 게시글 검증
    "required-title": "*제목을 입력해주세요.",
    "max-length-title": "*제목은 최대 26자까지 가능합니다."
};


class ValidateAutoDto {
    constructor(result, msg) {
        this.ok = result;
        this.msg = msg;
    }

    static ok(msg = "") { return new ValidateAutoDto(true, msg); }
    static fail(msg) { return new ValidateAutoDto(false, msg); }
}

export function __validateInputEmail(email) {
    if (!email || email.trim() === "") 
        return ValidateAutoDto.fail(msg["required-email"]);

    if (!email_regexp.test(email)) 
        return ValidateAutoDto.fail(msg["invalid-email"]);

    return ValidateAutoDto.ok();
}

export function __validateInputPassword(password) {
    if (!password || password.trim() === "") 
        return ValidateAutoDto.fail(msg["required-password"]);

    if (!password_regexp.test(password)) 
        return ValidateAutoDto.fail(msg["invalid-password"]);

    return ValidateAutoDto.ok();
}

export function __validateInputNickname(nickname) {

    if (!nickname || nickname.trim() === "") 
        return ValidateAutoDto.fail(msg["required-nickname"]);

    if (/\s/.test(nickname)) 
        return ValidateAutoDto.fail(msg["no-whitespace-nickname"]);

    if (nickname.length > 10)
        return ValidateAutoDto.fail(msg['max-length-nickname']);

    return ValidateAutoDto.ok();
}

export function __validatePostTitle(title) {
    const value = title?.trim() ?? "";
    if (!value) {
        return ValidateAutoDto.fail(msg["required-title"]);
    }
    if (value.length > 26) {
        return ValidateAutoDto.fail(msg["max-length-title"]);
    }

    return ValidateAutoDto.ok();
}
