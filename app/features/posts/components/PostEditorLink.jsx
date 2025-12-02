import { useNavigate } from "react-router";

export function PostEditorLink({ postId }) {
  const navigate = useNavigate();
  const goToEdit = () => {
    if (!postId) return;
    navigate(`/posts/${postId}/edit`);
  };
  return (
    <button type="button" className="icon-button-ghost" onClick={goToEdit} aria-label="게시글 수정">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm15.71-8.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67Z" />
      </svg>
    </button>
  );
}
