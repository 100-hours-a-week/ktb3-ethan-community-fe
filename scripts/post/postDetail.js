
import { __getFetch, __postFetch, __patchFetch, __deleteFetch } from "../api.js";
import { isLoggedIn } from "../auth.js";
import { formatDateForCard, setTextContent, formatCountForCard } from '../util.js';

const SUBMIT_LABEL_DEFAULT = "댓글 입력";
const SUBMIT_LABEL_EDIT = "댓글 수정";

const state = {
    postId: null,
    currentUserId: localStorage.getItem("user_id") ?? null,
    commentsCtx: null,
    postDetail: null,
    editingComment: null,
    pendingDelete: null,
};

const commentDeleteModal = {
    overlay: null,
    cancelBtn: null,
    confirmBtn: null,
};
const postDeleteModal = {
    overlay: null,
    cancelBtn: null,
    confirmBtn: null,
};

document.addEventListener('DOMContentLoaded', async () => {
    state.postId = resolvePostId();
    if (!state.postId) {
        window.location.replace("/index.html");
    }
    await initPostPage();
});

function resolvePostId() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("postId")) 
        return params.get("postId");
    return null;
}

async function initPostPage() {
    myProfileHandler();
    initLikeHandler();
    initPostEditButton();
    initCommentForm();
    initDeleteModal();
    await Promise.all([
        loadPostDetail(state.postId),
        loadCommentHandler(state.postId),
    ]);
}

function myProfileHandler() {
    const $myProfileImage = document.getElementById('myProfileImage');
    const url = localStorage.getItem('profile_image_url');

    if (url && url.trim() !== "" && url !== "dummy link") {
        $myProfileImage.src = url;
    }
}

function initCommentForm() {
    const $form = document.getElementById("comment-form");
    if (!$form) return;
    const $input = document.getElementById("inputComment");
    const $submit = document.getElementById("submitComment");
    if ($input && $submit) {
        syncCommentButtonState($input, $submit);
        $input.addEventListener("input", () => syncCommentButtonState($input, $submit));
    }
    setSubmitMode(false);
    $form.addEventListener("submit", handleCommentSubmit);
}

async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!state.postId) return;

    const $input = document.getElementById("inputComment");
    const $submit = document.getElementById("submitComment");
    if (!$input) return;

    const content = $input.value.trim();
    if (!content) return;

    const isEditing = !!state.editingComment;
    $submit?.setAttribute("disabled", "true");
    try {
        if (isEditing) {
            await submitCommentUpdate(content);
        } else {
            const res = await __postFetch(`/posts/${state.postId}/comments`, { content });
            if (!res.ok) return;
            const json = await res.json();
            if (!json?.data) return;
            appendComment(json.data);
        }
        $input.value = "";
        if (!isEditing) {
            exitEditMode(false);
        }
        syncCommentButtonState($input, $submit);
    } finally {
        $submit?.removeAttribute("disabled");
    }
}

async function submitCommentUpdate(content) {
    const editing = state.editingComment;
    if (!editing) return;
    const res = await __patchFetch(`/posts/${state.postId}/comments/${editing.id}`, { content });
    if (!res.ok) return;
    const json = await res.json();
    if (!json?.data) return;
    const updated = {
        ...json.data,
        user_id: json.data.user_id ?? json.data.userId,
        create_at: json.data.create_at ?? json.data.createAt,
    };
    updateCommentCard(editing.card, updated);
    exitEditMode();
}

function appendComment(comment) {
    const $list = state.commentsCtx?.$list ?? document.getElementById("comment-view");
    if (!$list) return;
    const card = createCommentElement(comment);
    $list.appendChild(card);
    adjustCommentCount(1);
}

function createCommentElement(comment) {
    const wrap = document.createElement("div");
    wrap.innerHTML = renderCommentCard(comment);
    const card = wrap.firstElementChild;
    storeCommentMeta(card, comment);
    applyCommentOwnerState(card, comment);
    bindCommentActions(card);
    return card;
}

function renderCommentCard(comment) {
    const createdAt = formatDateForCard(comment.create_at ?? comment.created_at);
    const nickname = comment.nickname ?? `사용자 ${comment.user_id ?? ""}`.trim();
    const img = comment.img ?? "./images/default_profile_image.png";
    return `
        <div class="comment-wrapper" data-comment-id="${comment.id ?? ""}">
            <div>
                <div class="comment-meta-area">
                    <div class="profile-image-wrapper author-profile-image">
                        <img class="profileImage" src="${img}" alt="">
                    </div>
                    <div class="authorNickname">
                        ${nickname}
                    </div>
                    <div class="post-card-date-field">
                        ${createdAt}
                    </div>
                </div>
                <div class="comment-content">
                    ${comment.content}
                </div>
            </div>
            <div class="comment-write-area">
                <button type="button" data-action="edit-comment">수정</button>
                <button type="button" data-action="delete-comment" data-role="postdeleteBtn">삭제</button>
            </div>
        </div>
    `;
}

function storeCommentMeta(card, comment) {
    if (!card) return;
    const existingUserId = card.dataset.commentUserId ?? "";
    card.dataset.commentId = comment.id ?? card.dataset.commentId ?? "";
    card.dataset.commentUserId = comment.user_id ?? comment.userId ?? existingUserId;
    card.dataset.commentContent = comment.content ?? card.dataset.commentContent ?? "";
    card.dataset.commentCreatedAt = comment.create_at ?? comment.createAt ?? comment.created_at ?? card.dataset.commentCreatedAt ?? "";
}

function applyCommentOwnerState(card, comment) {
    if (!card) return;
    const $actionArea = card.querySelector(".comment-write-area");
    if (!$actionArea) return;
    const commentUserId = comment?.user_id != null ? String(comment.user_id) : null;
    if (!state.currentUserId || !commentUserId || state.currentUserId !== commentUserId) {
        $actionArea.classList.add("hide");
    } else {
        $actionArea.classList.remove("hide");
    }
}

async function loadPostDetail(postId) {
    const res = await __getFetch(`/posts/${postId}`);
    if (!res.ok) return;
    const json = await res.json();
    if (!json?.data) return;
    applyPostDetail(json.data);
}

function applyPostDetail(post) {
    state.postDetail = post;
    const $summary = document.getElementById("post-summary");
    if ($summary && post.id != null) {
        $summary.dataset.postId = post.id;
    }

    setTextContent("post-title", post.title ?? "");
    setTextContent("post-author-nickname", post.author_nickname ?? "익명");
    setTextContent("post-created-at", formatDateForCard(post.created_at));
    setTextContent("post-content-text", post.content ?? "");

    const $authorImage = document.getElementById("post-author-image");
    if ($authorImage) {
        if (post.author_image_url) {
            $authorImage.src = post.author_image_url;
        } else {
            $authorImage.src = "../images/profile_placeholder.svg";
        }
    }

    const $postImage = document.getElementById("post-content-image");
    if ($postImage) {
        if (post.image) {
            $postImage.src = post.image;
            $postImage.classList.remove("hide");
        } else {
            $postImage.classList.add("hide");
        }
    }

    updateLikeVisual(post.like_count, post.did_like);
    setTextContent("post-view-count", formatCountForCard(post.view_count));
    setTextContent("post-comment-count", formatCountForCard(post.comment_count));

    const $authorArea = document.getElementById("author-area");
    if ($authorArea) {
        if (state.currentUserId && String(post.user_id) === state.currentUserId) {
            $authorArea.classList.remove("hide");
        } else {
            $authorArea.classList.add("hide");
        }
    }
}


async function loadCommentHandler(postId) {
    const ctx = {
        $list: document.getElementById("comment-view"),
        $sentinel: document.getElementById("sentinel"),
        loading: false,
        cursor: null,
        limit: 20,
        observer: null,
        postId,
    };

    if (!ctx.postId) 
        return;
    state.commentsCtx = ctx;
    ctx.observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) loadCommentMore(ctx);
    }, { rootMargin: "300px 0px" });

    ctx.observer.observe(ctx.$sentinel);

    await loadCommentMore(ctx);
}

async function loadCommentMore(ctx) {
    if (ctx.loading) return;
    ctx.loading = true;

    try {
        const params = new URLSearchParams({limit: ctx.limit});
        
        if (ctx.cursor != null) params.append("cursor", ctx.cursor);

        const res = await __getFetch(`/posts/${ctx.postId}/comments?${params.toString()}`);
        if (!res.ok) return;

        const json = await res.json();
        const comments = json.data?.comments ?? [];
        const frag = document.createDocumentFragment();

        comments.forEach((comment) => {
            frag.appendChild(createCommentElement(comment));
        });

        ctx.$list.appendChild(frag);

        const nextCursor = json.data?.next_cursor ?? null;
        ctx.cursor = nextCursor;
        if (ctx.cursor == null) ctx.observer.unobserve(ctx.$sentinel);
    } finally {
        ctx.loading = false;
    }
}

function bindCommentActions(card) {
    const editBtn = card.querySelector('[data-action="edit-comment"]');
    if (editBtn) {
        editBtn.addEventListener("click", () => enterEditMode(card));
    }
    const deleteBtn = card.querySelector('[data-action="delete-comment"]');
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => openDeleteModal(card));
    }
}

function enterEditMode(card) {
    if (!card) return;
    const commentId = card.dataset.commentId;
    if (!commentId) return;
    if (state.editingComment && state.editingComment.id !== commentId) {
        exitEditMode(false);
    }
    state.editingComment = { id: commentId, card };

    const $input = document.getElementById("inputComment");
    const $submit = document.getElementById("submitComment");
    if (!$input || !$submit) return;

    const content = card.dataset.commentContent ?? card.querySelector(".comment-content")?.textContent ?? "";
    $input.value = content;
    $input.focus();
    setSubmitMode(true);
    syncCommentButtonState($input, $submit);
}

function exitEditMode(clearInput = true) {
    state.editingComment = null;
    setSubmitMode(false);
    const $input = document.getElementById("inputComment");
    const $submit = document.getElementById("submitComment");
    if ($input && $submit) {
        if (clearInput) {
            $input.value = "";
        }
        syncCommentButtonState($input, $submit);
    }
}

function setSubmitMode(isEdit) {
    const $submit = document.getElementById("submitComment");
    if (!$submit) return;
    $submit.textContent = isEdit ? SUBMIT_LABEL_EDIT : SUBMIT_LABEL_DEFAULT;
}

function updateCommentCard(card, comment) {
    if (!card) return;
    const contentEl = card.querySelector(".comment-content");
    if (contentEl) {
        contentEl.textContent = comment.content ?? "";
    }
    const dateEl = card.querySelector(".post-card-date-field");
    if (dateEl) {
        dateEl.textContent = formatDateForCard(comment.create_at ?? comment.createAt ?? comment.created_at);
    }
    storeCommentMeta(card, {
        ...comment,
        create_at: comment.create_at ?? comment.createAt ?? comment.created_at,
    });
}

function adjustCommentCount(delta) {
    if (!state.postDetail) state.postDetail = {};
    const current = Number(state.postDetail.comment_count ?? 0);
    const next = Math.max(0, current + delta);
    state.postDetail.comment_count = next;
    setTextContent("post-comment-count", formatCountForCard(next));
}

function initLikeHandler() {
    const btn = document.getElementById("post-like-btn");
    if (!btn) return;
    btn.addEventListener("click", handleLikeToggle);
}

function initPostEditButton() {
    const btn = document.getElementById("postEditBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        if (!state.postId) return;
        window.location.href = `/page/postEdit.html?postId=${state.postId}`;
    });
}

async function handleLikeToggle() {
    if (!state.postId) return;
    const res = await __patchFetch(`/posts/${state.postId}/like`);
    if (!res.ok) return;

    const json = await res.json();
    if (!json?.data) return;
    if (!state.postDetail) state.postDetail = {};

    state.postDetail.like_count = json.data.likeCount ?? json.data.like_count;
    state.postDetail.did_like = json.data.didLike ?? json.data.did_like;
    updateLikeVisual(state.postDetail.like_count, state.postDetail.did_like);
}

function updateLikeVisual(likeCount, didLike) {
    setTextContent("post-like-count", formatCountForCard(likeCount));
    const btn = document.getElementById("post-like-btn");
    if (btn) {
        btn.classList.toggle("like-active", !!didLike);
    }
}

function syncCommentButtonState($input, $submit) {
    if (!$submit || !$input) return;
    const hasText = $input.value.trim().length > 0;
    $submit.classList.toggle("comment-submit-enabled", hasText);
    $submit.classList.toggle("comment-submit-disabled", !hasText);
    $submit.disabled = !hasText;
}

function initDeleteModal() {
    commentDeleteModal.overlay = document.getElementById("comment-delete-modal");
    commentDeleteModal.cancelBtn = document.getElementById("comment-delete-cancel");
    commentDeleteModal.confirmBtn = document.getElementById("comment-delete-confirm");

    postDeleteModal.overlay = document.getElementById("post-delete-modal");
    postDeleteModal.cancelBtn = document.getElementById("post-delete-cancel");
    postDeleteModal.confirmBtn = document.getElementById("post-delete-confirm");

    commentDeleteModal.cancelBtn?.addEventListener("click", closeCommentDeleteModal);
    commentDeleteModal.confirmBtn?.addEventListener("click", handleCommentDeleteConfirm);

    postDeleteModal.cancelBtn?.addEventListener("click", closePostDeleteModal);
    postDeleteModal.confirmBtn?.addEventListener("click", handlePostDeleteConfirm);

    const postDeleteBtn = document.getElementById("postdeleteBtn");
    postDeleteBtn?.addEventListener("click", openPostDeleteModal);
}

function openDeleteModal(card) {
    if (!card || !commentDeleteModal.overlay) return;
    const commentId = card.dataset.commentId;
    if (!commentId) return;
    state.pendingDelete = { id: commentId, card };
    commentDeleteModal.overlay.classList.remove("hide");
    commentDeleteModal.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeCommentDeleteModal() {
    if (!commentDeleteModal.overlay) return;
    commentDeleteModal.overlay.classList.add("hide");
    commentDeleteModal.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    state.pendingDelete = null;
}

async function handleCommentDeleteConfirm() {
    if (!state.postId || !state.pendingDelete) {
        closeCommentDeleteModal();
        return;
    }

    const { id, card } = state.pendingDelete;
    commentDeleteModal.confirmBtn?.setAttribute("disabled", "true");
    try {
        const res = await __deleteFetch(`/posts/${state.postId}/comments/${id}`);
        if (res?.ok) {
            card?.remove();
            adjustCommentCount(-1);
            if (state.editingComment?.id === id) {
                exitEditMode();
            }
        }
    } finally {
        commentDeleteModal.confirmBtn?.removeAttribute("disabled");
        closeCommentDeleteModal();
    }
}

function openPostDeleteModal() {
    if (!postDeleteModal.overlay) return;
    postDeleteModal.overlay.classList.remove("hide");
    postDeleteModal.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closePostDeleteModal() {
    if (!postDeleteModal.overlay) return;
    postDeleteModal.overlay.classList.add("hide");
    postDeleteModal.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

async function handlePostDeleteConfirm() {
    if (!state.postId) {
        closePostDeleteModal();
        return;
    }
    postDeleteModal.confirmBtn?.setAttribute("disabled", "true");
    try {
        const res = await __deleteFetch(`/posts/${state.postId}`);
        if (res?.ok) {
            window.location.replace("/index.html");
        }
    } finally {
        postDeleteModal.confirmBtn?.removeAttribute("disabled");
        closePostDeleteModal();
    }
}
