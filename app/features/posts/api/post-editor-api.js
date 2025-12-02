import { apiClient } from "../../../services/api-client";
export async function uploadThumbnail(file) {
  const formData = new FormData();
  formData.append("image", file);
  const options = {
    method: "POST",
    body: formData,
  };
  const res = await apiClient.request("/upload/post", options);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "이미지 업로드에 실패했습니다.");
  return json?.data;
}

export async function createPost(fetchWithAuth, payload) {
  const res = await fetchWithAuth("/posts", {
    method: "POST",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "게시글 작성에 실패했습니다.");
  return json?.data;
}

export async function updatePost(fetchWithAuth, postId, payload) {
  const res = await fetchWithAuth(`/posts/${postId}`, {
    method: "PATCH",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "게시글 수정에 실패했습니다.");
  return json?.data;
}

export async function deletePost(fetchWithAuth, postId) {
  const res = await fetchWithAuth(`/posts/${postId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? "게시글 삭제에 실패했습니다.");
  }
}
