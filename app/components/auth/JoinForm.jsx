import { useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../../services/api-client";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateNickname,
} from "../../utils/validation";
import { validationMessages } from "../../utils/msg";

const DEFAULT_IMAGE = "/images/profile_placeholder.svg";

export function JoinForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });
  const [profileImagePreview, setProfileImagePreview] = useState(DEFAULT_IMAGE);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    validateField(name, nextForm);
    if (name === "password" && nextForm.passwordConfirm) {
      validateField("passwordConfirm", nextForm);
    }
    setError("");
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setProfileImagePreview(loadEvent.target?.result || DEFAULT_IMAGE);
    };
    reader.readAsDataURL(file);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.request("/upload/profile", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? "이미지 업로드에 실패했습니다.");
      }
      const imageUrl =
        json?.data?.imageUrl ||
        json?.data?.image_url ||
        json?.data?.profile_image_url ||
        "";
      if (!imageUrl) {
        throw new Error("업로드 결과에 이미지 경로가 없습니다.");
      }
      setProfileImageUrl(imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "이미지 업로드에 실패했습니다.");
      setProfileImagePreview(DEFAULT_IMAGE);
      setProfileImageUrl("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validations = [
      validateEmail(form.email),
      validatePassword(form.password),
      validatePasswordConfirm(form.password, form.passwordConfirm),
      validateNickname(form.nickname),
    ];
    const firstError = validations.find((item) => !item.ok);
    if (firstError) {
      setError(firstError.msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nickname: form.nickname,
          profile_image_url: profileImageUrl || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? validationMessages.DUPLICATE_EMAIL);
      }
      alert("회원가입이 완료되었습니다. 로그인 후 이용해주세요.");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const validateField = (name, currentForm) => {
    let result = { ok: true, msg: "" };
    switch (name) {
      case "email":
        result = validateEmail(currentForm.email);
        break;
      case "password":
        result = validatePassword(currentForm.password);
        break;
      case "passwordConfirm":
        result = validatePasswordConfirm(currentForm.password, currentForm.passwordConfirm);
        break;
      case "nickname":
        result = validateNickname(currentForm.nickname);
        break;
      default:
        result = { ok: true, msg: "" };
    }
    setFieldErrors((prev) => ({
      ...prev,
      [name]: result.ok ? "" : result.msg,
    }));
  };

  return (
    <form id="join-form" onSubmit={handleSubmit}>
      <div className="join-grid">
        <div className="join-profile-panel">
          <label
            className="upload-circle join-upload-image"
            htmlFor="join-profile-input"
            style={{
              backgroundImage:
                profileImagePreview && profileImagePreview !== DEFAULT_IMAGE
                  ? `url('${profileImagePreview}')`
                  : undefined,
            }}
          >
            {profileImagePreview === DEFAULT_IMAGE ? <span className="plus-icon">+</span> : null}
            <input
              id="join-profile-input"
              type="file"
              accept="image/*"
              className="field__file__input"
              onChange={handleImageChange}
            />
          </label>
        </div>
        <div className="join-fields-panel">
          {uploadingImage ? <p className="auth-hint">이미지를 업로드 중입니다...</p> : null}
          <JoinField label="닉네임" hint={fieldErrors.nickname}>
            <input
              className="field__input"
              type="text"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              maxLength={10}
            />
          </JoinField>
          <JoinField label="이메일" hint={fieldErrors.email}>
            <input
              className="field__input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@example.com"
            />
          </JoinField>
          <JoinField label="비밀번호" hint={fieldErrors.password}>
            <input
              className="field__input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </JoinField>
          <JoinField label="비밀번호 확인" hint={fieldErrors.passwordConfirm}>
            <input
              className="field__input"
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
            />
          </JoinField>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" className="join-button" disabled={submitting}>
            {submitting ? "가입 중..." : "가입하기"}
          </button>
        </div>
      </div>
    </form>
  );
}

function JoinField({ label, children, hint }) {
  return (
    <label className="field__label join-field">
      <div>
        <span>{label}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
