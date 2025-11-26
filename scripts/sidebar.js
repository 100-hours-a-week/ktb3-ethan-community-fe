import { findDom, findDomOrNull } from "./util.js";
import { isLoggedIn, logOut } from './auth.js';
import {__postFetch} from './api.js';
import { __validateInputPassword, __validateInputEmail, msg } from "./validation.js";

export function initSideProfileCard(authed) {

    if (authed) {
        const $nickEl = findDomOrNull("[data-role='side-nickname']");
        const $thumb = findDomOrNull("[data-role='side-profile-image']");
        if ($nickEl) 
            $nickEl.textContent = localStorage.getItem("nickname") || "익명";
        if ($thumb)
            $thumb.src = localStorage.getItem("profile_image_url") || "/images/profile_placeholder.svg";
        injectLogoutButton();
    }

    document.querySelectorAll(".side-card [data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            if (action === "login") return openLoginModal();
            if (action === "join") return window.location.href = "/page/join.html";
            if (action === "write" && authed) {
                if (!isLoggedIn()) return openLoginModal();
                return window.location.href = "/page/postEdit.html";
            }
            if (action === "profile" && authed) {
                if (!isLoggedIn()) return openLoginModal();
                return window.location.href = "/page/profileEdit.html";
            }
            if (action === "logout" && authed) {
                logOut();
                window.location.replace("/index.html");
            }
        });
    });
}

function injectLogoutButton() {
    const actions = document.querySelector(".side-profile__actions");
    if (!actions) return;
    const exists = actions.querySelector("[data-action='logout']");
    if (exists) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-action", "logout");
    btn.textContent = "로그아웃";
    actions.appendChild(btn);
}

function openLoginModal() {
    let modal = document.getElementById("login-modal");
    if (!modal) {
        modal = buildLoginModal();
        document.body.appendChild(modal);
    }
    modal.classList.remove("hide");
}

function buildLoginModal() {
    const wrap = document.createElement("div");
    wrap.id = "login-modal";
    wrap.className = "login-modal hide";
    wrap.innerHTML = `
        <div class="login-modal__overlay" role="presentation"></div>
        <div class="login-modal__dialog" role="dialog" aria-label="로그인">
            <button class="login-modal__close" aria-label="닫기">&times;</button>
            <div class="login-modal__body">
                <div class="login-modal__branding">
                    <div class="login-modal__logo">하루 조각</div>
                    <div class="login-modal__subtitle">오늘의 조각을 공유해주세요</div>
                </div>
                <div class="login-modal__right">
                    <h2>로그인</h2>
                    <form id="login-modal-form">
                        <label>
                            이메일
                            <input name="email" type="email" placeholder="이메일을 입력하세요" required />
                            <div class="field__hint login-modal__hint-email"></div>
                        </label>
                        <label>
                            비밀번호
                            <div class="password-field">
                                <input name="password" type="password" placeholder="비밀번호를 입력하세요" autocomplete="off" required />
                                <button type="button" class="password-toggle" aria-label="비밀번호 보기"></button>
                            </div>
                            <div class="field__hint login-modal__hint"></div>
                        </label>
                        <div class="login-modal__actions">
                            <button type="submit" disabled>로그인</button>
                        </div>
                        <a class="login-modal__link" href="/page/join.html">회원가입</a>
                        <div class="login-modal__error" aria-live="polite"></div>
                    </form>
                </div>
            </div>
        </div>
    `;

    wrap.querySelector(".login-modal__overlay").addEventListener("click", closeLoginModal);
    wrap.querySelector(".login-modal__close").addEventListener("click", closeLoginModal);
    const form = wrap.querySelector("#login-modal-form");
    const emailInput = form.querySelector("input[name='email']");
    const passwordInput = form.querySelector("input[name='password']");
    const submitBtn = form.querySelector("button[type='submit']");
    const emailHint = form.querySelector(".login-modal__hint-email");
    const hintEl = form.querySelector(".login-modal__hint");
    const toggleBtn = form.querySelector(".password-toggle");

    const syncValidity = () => {
        const emailVal = emailInput.value.trim();
        const emailValidate = emailVal ? __validateInputEmail(emailVal) : { ok: false, msg: msg["required-email"] };
        const emailOk = emailValidate.ok;
        emailHint.textContent = emailOk ? "" : emailValidate.msg;

        const validate = __validateInputPassword(passwordInput.value);
        const pwOk = validate.ok;
        if (!passwordInput.value.trim()) {
            hintEl.textContent = msg["required-password"];
        } else {
            hintEl.textContent = pwOk ? "" : validate.msg;
        }
        submitBtn.disabled = !(emailOk && pwOk);
        submitBtn.classList.toggle("login-valid", emailOk && pwOk);
    };

    emailInput.addEventListener("input", syncValidity);
    passwordInput.addEventListener("input", syncValidity);
    attachPasswordToggle(passwordInput, toggleBtn);
    form.addEventListener("submit", (e) => handleLoginSubmit(e, syncValidity));

    return wrap;
}

function closeLoginModal() {
    const modal = document.getElementById("login-modal");
    if (modal) modal.classList.add("hide");
}


async function handleLoginSubmit(e, syncValidity) {
    e.preventDefault();
    const form = e.target;
    syncValidity?.();
    const email = form.email.value.trim();
    const password = form.password.value;
    const $dialog = form.closest(".login-modal__dialog");
    const $error = $dialog?.querySelector(".login-modal__error");
    const emailHint = $dialog?.querySelector(".login-modal__hint-email");
    const $hint = $dialog?.querySelector(".login-modal__hint");
    if ($hint) $hint.textContent = "";
    if (emailHint) emailHint.textContent = "";
    if ($error) $error.textContent = "";
    const emailValidate = email ? __validateInputEmail(email) : { ok: false, msg: msg["required-email"] };

    if (!emailValidate.ok || !password) {
        if (emailHint && !emailValidate.ok) emailHint.textContent = emailValidate.msg;
        if (!password && $hint) $hint.textContent = msg["required-password"];
        if ($error) $error.textContent = "이메일과 비밀번호를 입력해주세요.";
        return;
    }

    const pwValidate = __validateInputPassword(password);
    if (!pwValidate.ok) {
        if ($hint) $hint.textContent = pwValidate.msg;
        return;
    }

    try {
        const res = await __postFetch("/auth/login", { email, password });
        if (!res.ok) {
            if (res.status === 400) {
                if ($error) $error.textContent = msg["REQUIRED_INPUT"]
            }
            if (res.status === 401 || res.status === 404) {
                if ($error) $error.textContent = msg["wrong-login-info"];
            } else {
                if ($error) $error.textContent = "잠시 후 다시 시도해주세요.";
            }
            return;
        }
        
        closeLoginModal();
        location.reload();
    } catch {
        if ($error) $error.textContent = "네트워크 오류가 발생했습니다.";
    }
}

function attachPasswordToggle(input, button) {
    if (!input || !button) return;
    const icons = {
        show: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg>`,
        hide: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="m3 3 18 18-1.4 1.4-2.5-2.5C15.6 20 14 21 12 21 7 21 3 16.5 2 14c.6-1.5 2.7-4.3 5.7-5.8L1.6 4.4 3 3Zm7.5 7.5-1.1-1.1a4 4 0 0 1 4.7 4.7l-1.1-1.1A2.5 2.5 0 0 0 10.5 10.5ZM12 7c5 0 9 4.5 10 7-.3.8-1 2-2.2 3.2l-1.4-1.4A8.3 8.3 0 0 0 20.9 14C19.9 11.8 16.8 9 12 9c-.6 0-1.2 0-1.7.1L8.7 7.5C9.6 7.2 10.7 7 12 7Zm-7.9 7c.8 1.8 3.9 4.6 7.9 4.6 1 0 1.9-.2 2.7-.5l-1.6-1.6a7 7 0 0 1-6.3-2.5c-.7-.8-1-1.5-1.1-2Z"/></svg>`
    };

    const sync = () => {
        const show = input.type === "text";
        button.innerHTML = show ? icons.hide : icons.show;
        button.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
    };

    button.addEventListener("click", () => {
        input.type = input.type === "password" ? "text" : "password";
        sync();
    });

    sync();
}
