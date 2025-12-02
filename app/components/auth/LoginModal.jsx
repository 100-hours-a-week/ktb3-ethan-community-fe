import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/auth-context";
import { validateEmail, validatePassword } from "../../utils/validation";
import { validationMessages } from "../../utils/msg";

export function LoginModal({ open, onClose }) {
  const { login, status } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ email: "", password: "" });
      setError("");
      setShowPassword(false);
    }
  }, [open]);

  const emailCheck = useMemo(() => {
    if (!form.email.trim()) {
      return { ok: false, msg: validationMessages.REQUIRED_EMAIL };
    }
    return validateEmail(form.email);
  }, [form.email]);
  const hasPassword = form.password.trim().length > 0;
  const canSubmit = emailCheck.ok && hasPassword && status !== "loading";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordCheck = validatePassword(form.password);
    if (!emailCheck.ok) {
      setError(emailCheck.msg);
      return;
    }
    if (!passwordCheck.ok) {
      setError(passwordCheck.msg);
      return;
    }

    try {
      await login({ email: form.email, password: form.password });
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : validationMessages.WRONG_LOGIN_INFO);
    }
  };

  if (!open) return null;

  return (
    <div className="login-modal">
      <div className="login-modal__overlay" role="presentation" onClick={onClose} />
      <div className="login-modal__dialog" role="dialog" aria-label="로그인">
        <button className="login-modal__close" aria-label="닫기" onClick={onClose}>
          &times;
        </button>
        <div className="login-modal__body">
          <div className="login-modal__branding">
            <div className="login-modal__logo">하루 조각</div>
            <div className="login-modal__subtitle">오늘의 조각을 공유해주세요</div>
          </div>
          <div className="login-modal__right">
            <h2>로그인</h2>
            <form id="login-modal-form" onSubmit={handleSubmit}>
              <label>
                이메일
                <input
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={form.email}
                  onChange={handleChange}
                  onInput={(event) => event.target.setCustomValidity("")}
                  required
                />
              </label>
              <label>
                비밀번호
                <div className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </label>
              <div className="login-modal__actions">
                <button type="submit" className={canSubmit ? "login-valid" : ""} disabled={!canSubmit}>
                  {status === "loading" ? "로그인 중..." : "로그인"}
                </button>
                {error ? <div className="login-modal__error">{error}</div> : <div className="login-modal__error" />}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        stroke="#6c5ce7"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="m3 3 18 18-1.4 1.4-2.5-2.5C15.6 20 14 21 12 21 7 21 3 16.5 2 14c.6-1.5 2.7-4.3 5.7-5.8L1.6 4.4 3 3Zm7.5 7.5-1.1-1.1a4 4 0 0 1 4.7 4.7l-1.1-1.1A2.5 2.5 0 0 0 10.5 10.5ZM12 7c5 0 9 4.5 10 7-.3.8-1 2-2.2 3.2l-1.4-1.4A8.3 8.3 0 0 0 20.9 14C19.9 11.8 16.8 9 12 9c-.6 0-1.2 0-1.7.1L8.7 7.5C9.6 7.2 10.7 7 12 7Zm-7.9 7c.8 1.8 3.9 4.6 7.9 4.6 1 0 1.9-.2 2.7-.5l-1.6-1.6a7 7 0 0 1-6.3-2.5c-.7-.8-1-1.5-1.1-2Z"
        stroke="#6c5ce7"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
