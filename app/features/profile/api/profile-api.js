import { apiClient } from "../../../services/api-client";

export async function fetchUserDetail(fetchWithAuth, userId) {
  const res = await fetchWithAuth(`/users/${userId}`, { method: "GET" });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "사용자 정보를 불러오지 못했습니다.");
  return json?.data;
}

export async function updateProfile(fetchWithAuth, payload) {
  const res = await fetchWithAuth("/users", {
    method: "PATCH",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "프로필을 수정하지 못했습니다.");
  return json?.data;
}

export async function deleteAccount(fetchWithAuth) {
  const res = await fetchWithAuth("/users", {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? "회원탈퇴에 실패했습니다.");
  }
}

export async function changePassword(fetchWithAuth, payload) {
  const res = await fetchWithAuth("/users/password", {
    method: "PATCH",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "비밀번호 변경에 실패했습니다.");
  return json?.data;
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await apiClient.request("/upload/profile", {
    method: "POST",
    body: formData,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "프로필 이미지를 업로드하지 못했습니다.");
  return json?.data;
}
