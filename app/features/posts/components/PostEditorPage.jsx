import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../../providers/auth-context";
import { fetchPost } from "../api/post-detail-api";
import { createPost, updatePost, uploadThumbnail } from "../api/post-editor-api";
import { validatePostTitle } from "../../../utils/validation";

export function PostEditorPage({ mode = "create" }) {
  const { postId: paramPostId } = useParams();
  const postId = mode === "edit" ? paramPostId : null;
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    content: "",
    thumbnail_image_url: "",
  });
  const [imageHint, setImageHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !postId) return;
    fetchPost(fetchWithAuth, postId)
      .then((data) => {
        setForm({
          title: data.title ?? "",
          content: data.content ?? "",
          thumbnail_image_url: data.thumbnail_image_url ?? "",
        });
      })
      .catch((err) => setError(err.message));
  }, [fetchWithAuth, mode, postId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageHint("이미지를 업로드 중입니다...");
    try {
      const data = await uploadThumbnail(file);
      console.log(data);
      setForm((prev) => ({
        ...prev,
        thumbnail_image_url:
          data?.image_url ?? "",
      }));
      setImageHint("이미지가 업로드되었습니다.");
    } catch (err) {
      setImageHint(err instanceof Error ? err.message : "이미지 업로드 실패");
    }
  };

  const titleValidation = useMemo(() => validatePostTitle(form.title), [form.title]);
  const canSubmit = titleValidation.ok && form.content.trim() && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!titleValidation.ok) {
      setError(titleValidation.msg);
      return;
    }
    if (!form.content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "edit" && postId) {
        await updatePost(fetchWithAuth, postId, form);
        navigate(`/posts/${postId}`);
      } else {
        const created = await createPost(fetchWithAuth, form);
        navigate(`/posts/${created?.id ?? ""}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="postedit-page">
      <div className="postedit-wrapper">
        <h1 id="post-edit">{mode === "edit" ? "게시글 수정" : "게시글 작성"}</h1>
        <form id="post-edit-form" onSubmit={handleSubmit}>
          <div className="post-edit-filed">
            <div className="edit-box">
              <input
                id="inputPostEditTitle"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={26}
                placeholder="제목을 입력하세요"
              />
            </div>
            {titleValidation.ok ? <span id="hintTitle" /> : <span id="hintTitle">{titleValidation.msg}</span>}
          </div>
          <div className="post-edit-filed">
            <div className="edit-box">
              <textarea
                id="inputPostEditContent"
                name="content"
                rows={10}
                value={form.content}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
              />
            </div>
          </div>
          <div className="post-edit-filed">
            <div>
              <div htmlFor="inputPostEditImage">대표 이미지</div>
              <input type="file" id="inputPostEditImage" accept="image/*" onChange={handleImageChange} />
            </div>
            {form.thumbnail_image_url ? (
              <img src={form.thumbnail_image_url} alt="" className="post-content-img" />
            ) : null}
            {imageHint ? <p id="hintImage">{imageHint}</p> : null}
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          <button
            type="submit"
            id="inputPostEditSubmit"
            className={`post-edit-submit-btn ${
              canSubmit ? "post-edit-submit-enabled" : "post-edit-submit-disabled"
            }`}
            disabled={!canSubmit}
          >
            {loading ? "저장 중..." : mode === "edit" ? "수정하기" : "완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
