import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  createComment,
  deleteComment,
  fetchPost,
  toggleLike,
  updateComment,
} from "../api/post-detail-api";
import { deletePost } from "../api/post-editor-api";
import { useAuth } from "../../../providers/auth-context";
import { formatDate } from "../../../utils/format";
import { useInfiniteComments } from "../hooks/useInfiniteComments";
import { PostEditorLink } from "./PostEditorLink";
import { LoginModal } from "../../../components/auth/LoginModal";
import { apiClient } from "../../../services/api-client";
import { upsertRecentPost } from "../utils/recent-posts";

export function PostDetailPage() {
  const { postId } = useParams();
  const { fetchWithAuth, user, isAuthenticated } = useAuth();
  const publicRequest = apiClient.requestPublic;
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postError, setPostError] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const {
    comments,
    hasMore,
    loadMore,
    error: commentError,
    reload,
    loading: commentsLoading,
  } = useInfiniteComments(postId);
  const sentinelRef = useRef(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoadingPost(true);
    const candidates = [];
    if (isAuthenticated) {
      candidates.push(fetchWithAuth, apiClient.request);
    }
    candidates.push(publicRequest);
    let lastError = null;
    for (const client of candidates) {
      try {
        const data = await fetchPost(client, postId);
        setPost(data);
        upsertRecentPost({
          id: data?.id,
          user_nickname: data?.user_nickname ?? data?.user_nick_name,
          title: data?.title,
          thumbnail_image_url: data?.thumbnail_image_url,
          created_at: data?.created_at,
        });
        setPostError("");
        setLoadingPost(false);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("게시글을 불러오지 못했습니다.");
        if (!error?.status || error.status >= 500) {
          break;
        }
      }
    }
    setPost(null);
    setPostError(lastError?.message ?? "게시글을 불러오지 못했습니다.");
    setLoadingPost(false);
  }, [fetchWithAuth, isAuthenticated, postId, publicRequest]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const handleLike = async () => {
    if (!postId) return;
    try {
      const result = await toggleLike(fetchWithAuth, postId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              like_count: result?.likeCount ?? result?.like_count ?? prev.like_count,
              did_like: result?.didLike ?? result?.did_like ?? prev.did_like,
            }
          : prev
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!postId || !commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      if (editingCommentId) {
        await updateComment(fetchWithAuth, postId, editingCommentId, {
          content: commentInput,
        });
      } else {
        await createComment(fetchWithAuth, postId, { content: commentInput });
        setPost((prev) =>
          prev ? { ...prev, comment_count: Number(prev.comment_count || 0) + 1 } : prev
        );
      }
      reload();
      setCommentInput("");
      setEditingCommentId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setCommentInput(content);
  };

  const handleDeleteComment = async (commentId) => {
    if (!postId) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteComment(fetchWithAuth, postId, commentId);
    reload();
    setPost((prev) =>
      prev
        ? { ...prev, comment_count: Math.max(0, Number(prev.comment_count || 0) - 1) }
        : prev
    );
  };

  const canEditPost =
    post && user?.id && post.user_id != null && Number(post.user_id) === Number(user.id);

  const handleDeletePost = async () => {
    if (!postId) return;
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(fetchWithAuth, postId);
      alert("게시글이 삭제되었습니다.");
      navigate("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "게시글 삭제에 실패했습니다.");
    }
  };

  if (loadingPost) {
    return <div className="post-page">게시글을 불러오는 중입니다...</div>;
  }

  if (postError) {
    return <div className="post-page">{postError}</div>;
  }

  if (!post) {
    return <div className="post-page">게시글을 찾을 수 없습니다.</div>;
  }

  const authorNickname =
    post.user_nickname ??
    post.user_nick_name ??
    post.userNickname ??
    post.userNickName ??
    post.author_nickname ??
    "익명";
  const authorImage =
    post.user_profile_image_url ||
    post.userProfileImageUrl ||
    post.author_profile_image_url ||
    post.author_image_url ||
    "/images/profile_placeholder.svg";

  const openImageModal = () => {
    if (post?.thumbnail_image_url) {
      setImageModalOpen(true);
    }
  };

  const closeImageModal = () => setImageModalOpen(false);

  return (
    <div className="post-page">
      <div className="post-wrapper">
        <section className="post-detail-card">
        <div id="post-summary" data-post-id={post.id}>
          <div className="post-title-row">
            <h1 id="post-title">{post.title}</h1>
            {canEditPost ? (
              <div className="post-action-row">
                <PostEditorLink postId={post.id} />
                <button
                  type="button"
                  className="icon-button-ghost icon-button-danger"
                  onClick={handleDeletePost}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Z" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
          <div className="post-author-meta">
              <div className="author-meta-left">
                <img className="profile-image" src={authorImage} alt={authorNickname} />
                <div>
                  <div className="authorNickname" id="post-author-nickname">
                    {authorNickname}
                  </div>
                  {post.user_email ? <div className="author-email">{post.user_email}</div> : null}
                  <div id="post-created-at">{formatDate(post.created_at)}</div>
                </div>
              </div>
              <div className="post-detail-counts">
                <button
                  id="post-like-btn"
                  type="button"
                  className={`icon-btn ${post.did_like ? "like-active" : ""}`}
                  onClick={handleLike}
                  disabled={!isAuthenticated}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 21s-6.4-4.2-9-9.2C1 8 2.4 4.5 6 4.5c2 0 3.4 1.4 4 2.4.6-1 2-2.4 4-2.4 3.6 0 5 3.5 3 7.3-2.6 5-9 9.2-9 9.2Z" />
                  </svg>
                  <span id="post-like-count">{post.like_count}</span>
                </button>
                <div className="icon-meta">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 5h16v10H7l-3 3V5Z" />
                  </svg>
                  <span id="post-comment-count">{post.comment_count}</span>
                </div>
                <div className="icon-meta">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                  </svg>
                  <span id="post-view-count">{post.view_count}</span>
                </div>
              </div>
            </div>
          </div>
          <div id="post-content-wrapper">
            {post.thumbnail_image_url ? (
              <button
                type="button"
                className="post-image-button"
                onClick={openImageModal}
                aria-label="대표 이미지 크게 보기"
              >
                <img
                  id="post-content-image"
                  className="post-content-img"
                  src={post.thumbnail_image_url}
                  alt="게시글 대표 이미지"
                />
              </button>
            ) : null}
            <div id="post-content-text">{post.content}</div>
          </div>

          <button type="button" className="icon-button-return" onClick={() => navigate("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4z" />
            </svg>
            <span>목록으로</span>
          </button>
        </section>
        <div className="comment-area-wrapper">
          <section id="comment-view">
            {comments.map((comment) => {
              const canEdit =
                user?.id &&
                (comment.user_id != null || comment.author_id != null) &&
                Number(comment.user_id ?? comment.author_id) === Number(user.id);
              const commentNickname =
                comment.user_nickname ??
                comment.user_nick_name ??
                comment.userNickname ??
                comment.nickname ??
                "익명";
              const commentImage =
                comment.user_profile_image_url ||
                comment.userProfileImageUrl ||
                comment.profile_image_url ||
                "/images/profile_placeholder.svg";
              const commentDate = formatDate(comment.create_at ?? comment.createAt ?? comment.created_at);
              return (
                <div className="comment-wrapper" key={comment.id}>
                  <div>
                    <div className="comment-meta-area">
                      <div className="profile-image-wrapper author-profile-image">
                        <img className="profile-image" src={commentImage} alt={commentNickname} />
                      </div>
                      <div>
                        <div className="authorNickname">{commentNickname}</div>
                        {comment.user_email ? <div className="author-email">{comment.user_email}</div> : null}
                        <div className="post-card-date-field">{commentDate}</div>
                      </div>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
              {canEdit ? (
                <div className="comment-write-area">
                  <button
                    type="button"
                    className="comment-action"
                    aria-label="댓글 수정"
                    onClick={() => startEditComment(comment.id, comment.content)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm15.71-8.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="comment-action comment-action--danger"
                    aria-label="댓글 삭제"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Z" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
            {commentError ? <div className="posts-error">{commentError}</div> : null}
            <div id="sentinel" ref={sentinelRef}>
              {commentsLoading ? "댓글을 불러오는 중..." : hasMore ? "" : "댓글을 모두 확인했습니다."}
            </div>
          </section>
          <section id="comment-write">
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit}>
                <div>
                  <textarea
                    id="inputComment"
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    placeholder="댓글을 입력하세요"
                  />
                </div>
                <div>
                  <button
                    id="submitComment"
                    type="submit"
                    className={`comment-submit-btn ${
                      commentInput.trim() ? "comment-submit-enabled" : "comment-submit-disabled"
                    }`}
                    disabled={!commentInput.trim() || submittingComment}
                  >
                    {editingCommentId ? "댓글 수정" : "댓글 입력"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="comment-login-prompt">
                <p>댓글 작성을 하려면 로그인이 필요합니다.</p>
                <button type="button" onClick={() => setLoginModalOpen(true)}>
                  로그인하기
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      {imageModalOpen ? (
        <div className="post-image-modal" role="dialog" aria-label="이미지 확대 보기">
          <div className="post-image-modal__overlay" onClick={closeImageModal} />
          <div className="post-image-modal__content">
            <button
              type="button"
              className="post-image-modal__close"
              aria-label="닫기"
              onClick={closeImageModal}
            >
              ×
            </button>
            <img src={post.thumbnail_image_url} alt="확대된 게시글 이미지" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
