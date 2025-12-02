import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../providers/auth-context";
import {
  fetchUserDetail,
  updateProfile,
  deleteAccount,
  uploadProfileImage,
} from "../api/profile-api";
import { validateNickname } from "../../../utils/validation";

const DEFAULT_IMAGE = "/images/profile_placeholder.svg";

export function ProfileEditForm() {
  const { fetchWithAuth, user, logout, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(DEFAULT_IMAGE);
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState("idle");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    fetchUserDetail(fetchWithAuth, user.id)
      .then((data) => {
        setNickname(data?.nickname ?? "");
        setEmail(data?.email ?? "");
        setProfileImageUrl(data?.profile_image_url || DEFAULT_IMAGE);
      })
      .catch((err) => setHint(err.message));
  }, [fetchWithAuth, user?.id]);

  const handleNicknameChange = (event) => {
    const { value } = event.target;
    setNickname(value);
    const result = validateNickname(value);
    setHint(result.ok ? "" : result.msg);
  };

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const data = await uploadProfileImage(file);
      const uploaded =
        data?.image_url ?? data?.imageUrl ?? data?.profile_image_url ?? data?.profileImageUrl;
      if (uploaded) {
        setProfileImageUrl(uploaded);
      } else {
        throw new Error("업로드 결과에서 이미지를 확인할 수 없습니다.");
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateNickname(nickname);
    if (!result.ok) {
      setHint(result.msg);
      return;
    }
    setStatus("saving");
    try {
      await updateProfile(fetchWithAuth, {
        nickname,
        profile_image_url: profileImageUrl === DEFAULT_IMAGE ? null : profileImageUrl,
      });
      setUser({
        ...(user ?? {}),
        nickname,
        profileImageUrl: profileImageUrl === DEFAULT_IMAGE ? null : profileImageUrl,
      });
      alert("프로필 수정 완료");
    } catch (error) {
      setHint(error instanceof Error ? error.message : "프로필 수정 실패");
    } finally {
      setStatus("idle");
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까?")) return;
    await deleteAccount(fetchWithAuth);
    await logout();
    navigate("/login");
  };

  const previewStyle =
    profileImageUrl && profileImageUrl !== DEFAULT_IMAGE
      ? { backgroundImage: `url(${profileImageUrl})` }
      : {};

  return (
    <form className="profile-edit-form" onSubmit={handleSubmit}>
      <h1>회원정보 수정</h1>
      <div className="profile-edit-image-wrapper">
        <label className="upload-circle" htmlFor="profile-image-input" style={previewStyle}>
          {!profileImageUrl || profileImageUrl === DEFAULT_IMAGE ? (
            <span className="plus-icon">+</span>
          ) : null}
          <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            className="field__file__input"
            onChange={handleUploadChange}
          />
        </label>
      </div>
      {uploading ? <p className="auth-hint">이미지를 업로드 중입니다...</p> : null}
      {uploadError ? <p className="auth-error">{uploadError}</p> : null}
      <div className="form-field progile-edit-email-field">
        이메일
        <p id="email-view">{email || "이메일 정보를 불러오지 못했습니다."}</p>
      </div>
      <label className="form-field">
        닉네임
        <input
          type="text"
          id="inputNickname"
          value={nickname}
          onChange={handleNicknameChange}
          maxLength={10}
          placeholder="닉네임을 입력하세요"
        />
      </label>
      {hint ? <p className="auth-error">{hint}</p> : null}
      <div className="profile-edit-actions">
        <button
          type="submit"
          className="profile-edit-button"
          disabled={status === "saving" || uploading || !nickname.trim()}
        >
          {status === "saving" ? "저장 중..." : "수정"}
        </button>
        <button type="button" className="withdraw-button" onClick={handleWithdraw}>
          회원탈퇴
        </button>
      </div>
    </form>
  );
}
