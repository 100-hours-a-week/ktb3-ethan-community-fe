export async function fetchPost(fetchClient, postId) {
  const res = await fetchClient(`/posts/${postId}`, { method: "GET" });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw createApiError(res, json?.message ?? "게시글을 불러오지 못했습니다.");
  return json?.data ?? null;
}

export async function fetchComments(fetchClient, postId, { cursor, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor != null) params.append("cursor", String(cursor));
  const res = await fetchClient(`/posts/${postId}/comments?${params.toString()}`, {
    method: "GET",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw createApiError(res, json?.message ?? "댓글을 불러오지 못했습니다.");
  const rawComments = json?.data?.comments ?? [];
  const normalized = rawComments.map((comment) => ({
    ...comment,
    user_id: comment.user_id ?? comment.userId ?? comment.author_id ?? null,
    user_nickname:
      comment.user_nickname ?? comment.userNickname ?? comment.user_nick_name ?? comment.nickname ?? null,
    user_profile_image_url:
      comment.user_profile_image_url ?? comment.userProfileImageUrl ?? comment.profile_image_url ?? null,
    create_at: comment.create_at ?? comment.createAt ?? comment.created_at ?? null,
  }));
  return {
    comments: normalized,
    nextCursor: json?.data?.next_cursor ?? json?.data?.nextCursor ?? null,
  };
}

export async function createComment(fetchWithAuth, postId, payload) {
  const res = await fetchWithAuth(`/posts/${postId}/comments`, {
    method: "POST",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "댓글 작성에 실패했습니다.");
  return json?.data;
}

export async function updateComment(fetchWithAuth, postId, commentId, payload) {
  const res = await fetchWithAuth(`/posts/${postId}/comments/${commentId}`, {
    method: "PATCH",
    body: payload,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "댓글 수정에 실패했습니다.");
  return json?.data;
}

export async function deleteComment(fetchWithAuth, postId, commentId) {
  const res = await fetchWithAuth(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const error = new Error(json?.message ?? "댓글 삭제에 실패했습니다.");
    error.status = res.status;
    throw error;
  }
}

export async function toggleLike(fetchWithAuth, postId) {
  const res = await fetchWithAuth(`/posts/${postId}/like`, {
    method: "PATCH",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(json?.message ?? "좋아요를 변경하지 못했습니다.");
    error.status = res.status;
    throw error;
  }
  return json?.data;
}

function createApiError(response, message) {
  const error = new Error(message);
  error.status = response.status;
  return error;
}
