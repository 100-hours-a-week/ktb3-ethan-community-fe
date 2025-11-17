
import { __getFetch, __postFetch } from "../api.js";
import { isLoggedIn } from "../auth.js";
import { formatCountForCard } from '../util.js';
import { findDom } from "../util.js";

document.addEventListener('DOMContentLoaded', async () => {
    initSidebarAuthUI();
    await initPostsPage();
    
});


async function initPostsPage() {
    myProfileHandler();
    initPostWriteButton();
    initSideProfileCard();
    await loadPostHandler();
}

function myProfileHandler() {
    const $myProfileImage = document.getElementById('myProfileImage');
    const url = localStorage.getItem('profile_image_url');

    if ($myProfileImage) {
        if (url && url.trim() !== "" && url !== "dummy link") {
            $myProfileImage.src = url;
        } else {
            $myProfileImage.src = "/images/profile_placeholder.svg";
        }
    }
}

function initPostWriteButton() {
    const btn = document.getElementById("post-write-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        if (!isLoggedIn()) {
            openLoginModal();
            return;
        }
        window.location.href = "/page/postEdit.html";
    });
}
function canScroll(rootEl) {
    return rootEl.scrollHeight > rootEl.clientHeight + 50; // 여유 50px
}

async function fillUntilScrollable(ctx, msnry) {
    const root = ctx.$scrollRoot || document.documentElement;

    while (!canScroll(root) && ctx.cursor != null) {
        await loadMorePosts(ctx, msnry);
    }
}


async function loadPostHandler() {
    const grid = document.getElementById("posts-view");
    const msnry = new Masonry(grid, {
        itemSelector: '.post-card',
        columnWidth: '.grid-sizer',
        percentPosition: true,
        gutter: 16,
        transitionDuration: '0.25s',
    });

    const ctx = {
        $list: grid,
        $sentinel: document.getElementById("sentinel"),
        $scrollRoot: document.querySelector(".posts-wrapper"),
        loading: false,
        cursor: null,
        limit: 10,
        observer: null,
    };

    ctx.observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            loadMorePosts(ctx, msnry);
        }
    }, {
        rootMargin: "300px 0px",
        root: ctx.$scrollRoot || null
    });

    ctx.observer.observe(ctx.$sentinel);

    await loadMorePosts(ctx, msnry);
    await fillUntilScrollable(ctx, msnry);
}


async function loadMorePosts(ctx, msnry) {
    if (ctx.loading) return;
    ctx.loading = true;

    try {
        const params = new URLSearchParams({ limit: ctx.limit });
        if (ctx.cursor != null) params.append("cursor", ctx.cursor);

        const res = await __getFetch(`/posts?${params.toString()}`);
        if (!res.ok) return;

        const json = await res.json();
        const posts = json.data?.posts ?? [];

        const newItems = [];
        const grid = ctx.$list;

        posts.forEach(post => {
            const wrap = document.createElement("div");
            wrap.innerHTML = renderPostCard(post);
            const card = wrap.firstElementChild;

            card.addEventListener("click", () => {
                window.location.href = `/page/post.html?postId=${post.id}`;
            });

            grid.appendChild(card);
            newItems.push(card);
        });

        if (newItems.length > 0) {
            msnry.appended(newItems);
            msnry.layout();
        }

        const prevCursor = ctx.cursor;
        const nextCursor = normalizeCursor(json.data?.next_cursor);

        if (posts.length === 0) {
            ctx.cursor = null;
            if (ctx.observer && ctx.$sentinel) {
                ctx.observer.unobserve(ctx.$sentinel);
            }
            return;
        }

        if (nextCursor === prevCursor) {
            ctx.cursor = null;
            if (ctx.observer && ctx.$sentinel) {
                ctx.observer.unobserve(ctx.$sentinel);
            }
            return;
        }

        ctx.cursor = nextCursor;

        if (ctx.cursor == null && ctx.observer && ctx.$sentinel) {
            ctx.observer.unobserve(ctx.$sentinel);
        }
    } finally {
        ctx.loading = false;
    }
}



function normalizeCursor(value) {
    if (value == null) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return num;
}

function renderPostCard(post) {
    const imageUrl = (post.image_url && post.image_url.trim()) ? post.image_url : "";
    const likeCount = formatCountForCard(post.like_count);
    const commentCount = formatCountForCard(post.comment_count);
    const viewCount = formatCountForCard(post.view_count);
    const extraClass = resolveExtraClass(post.view_count);
    const authorMeta = renderAuthorMeta(post);
    const cardImage = imageUrl ? `<div class="post-card__image" style="background-image:url('${imageUrl}')"></div>` : "";
    return `
        <article class="post-card ${extraClass}" post-id="${post.id}">
            ${cardImage}
            <div class="post-card__title">${post.title}</div>
            <div class="post-card__content">${post.content}</div>
            <div class="post-card-meta-field">
                ${authorMeta}
                <div class="post-card-count-field">
                    <span class="likeCount"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s-6.4-4.2-9-9.2C1 8 2.4 4.5 6 4.5c2 0 3.4 1.4 4 2.4.6-1 2-2.4 4-2.4 3.6 0 5 3.5 3 7.3-2.6 5-9 9.2-9 9.2Z"/></svg><span>${likeCount}</span></span>
                    <span class="commentCount"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v10H7l-3 3V5Z"/></svg><span>${commentCount}</span></span>
                    <span class="viewCount"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/></svg><span>${viewCount}</span></span>
                </div>
            </div>
        </article>
    `;
}

function resolveExtraClass(viewCountRaw) {
    const views = Number(viewCountRaw) || 0;
    if (views >= 50) return "popularity3";
    if (views >= 30) return "popularity2";
    if (views >= 10) return "popularity1";
    return "";
}

function renderAuthorMeta(post) {
    const views = Number(post.view_count) || 0;
    const nickname = post.author_nickname || "익명";
    if (views >= 30) {
        const img = (post.profile_image_url && post.profile_image_url.trim()) ? post.profile_image_url : "/images/profile_placeholder.svg";
        return `
            <div class="post-card__author">
                <img src="${img}" alt="작성자 프로필">
                <span class="post-card__author-name">${nickname}</span>
            </div>
        `;
    }
    if (views >= 10) {
        return `<div class="post-card__author"><span class="post-card__author-name">${nickname}</span></div>`;
    }
    return `<div class="post-card__author empty-author" aria-hidden="true"></div>`;
}

function renderContentSnippet(p) {
    const raw = p.content || p.body || "";
    const text = (raw || "").toString().trim();
    if (!text) return "";
    const maxLen = 130;
    const snippet = text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
    return snippet.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initSideProfileCard() {
    const authed = isLoggedIn();
    const guest = document.querySelector(".side-profile [data-guest]");
    const welcome = document.querySelector(".side-profile [data-auth-only]");
    const nickEl = document.querySelector("[data-role='side-nickname']");
    const thumb = document.querySelector("[data-role='side-profile-image']");

    guest?.classList.toggle("hide", authed);
    welcome?.classList.toggle("hide", !authed);

    if (authed) {
        const nick = localStorage.getItem("nickname") || "익명";
        const img = localStorage.getItem("profile_image_url");
        if (nickEl) nickEl.textContent = nick;
        if (thumb) thumb.style.backgroundImage = img ? `url('${img}')` : "url('/images/profile_placeholder.svg')";
    }

    document.querySelectorAll(".side-card [data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            if (action === "login") return openLoginModal();
            if (action === "join") return window.location.href = "/page/join.html";
            if (action === "write") {
                if (!isLoggedIn()) return openLoginModal();
                return window.location.href = "/page/postEdit.html";
            }
            if (action === "profile") {
                if (!isLoggedIn()) return openLoginModal();
                return window.location.href = "/page/profileEdit.html";
            }
        });
    });
}

function initSidebarAuthUI() {
    const authed = isLoggedIn();
    document.querySelectorAll("[data-auth-only]").forEach(el => {
        el.classList.toggle("hide", !authed);
    });

    const $loginBtn = document.getElementById("side-login-btn");
    if ($loginBtn) {
        $loginBtn.classList.toggle("hide", authed);
        if (!authed) {
            $loginBtn.addEventListener("click", openLoginModal);
        }
    }
}

function openLoginModal() {
    let modal = document.getElementById("login-modal");
    if (!modal) {
        modal = buildLoginModal();
        document.body.appendChild(modal);
    }
    modal.classList.remove("hide");
}

function closeLoginModal() {
    const modal = document.getElementById("login-modal");
    if (modal) modal.classList.add("hide");
}

function buildLoginModal() {
    const wrap = document.createElement("div");
    wrap.id = "login-modal";
    wrap.className = "login-modal hide";
    wrap.innerHTML = `
        <div class="login-modal__overlay" role="presentation"></div>
        <div class="login-modal__dialog" role="dialog" aria-label="로그인">
            <button class="login-modal__close" aria-label="닫기">&times;</button>
            <h2>로그인</h2>
            <form id="login-modal-form">
            <label>
                이메일
                <input name="email" type="email" placeholder="이메일을 입력하세요" required />
            </label>
            <label>
                비밀번호
                <input name="password" type="password" placeholder="비밀번호를 입력하세요" required />
            </label>
            <div class="login-modal__actions">
                <button type="submit">로그인</button>
            </div>
            <div class="login-modal__error" aria-live="polite"></div>
            </form>
        </div>
    `;

    wrap.querySelector(".login-modal__overlay").addEventListener("click", closeLoginModal);
    wrap.querySelector(".login-modal__close").addEventListener("click", closeLoginModal);
    wrap.querySelector("#login-modal-form").addEventListener("submit", handleLoginSubmit);

    return wrap;
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const $dialog = form.closest(".login-modal__dialog");
    const $error = $dialog?.querySelector(".login-modal__error");
    if ($error) $error.textContent = "";
    if (!email || !password) {
        if ($error) $error.textContent = "이메일과 비밀번호를 입력해주세요.";
        return;
    }

    try {
        const res = await __postFetch("/users/auth/token", { email, password });
        if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
                if ($error) $error.textContent = "이메일 또는 비밀번호가 올바르지 않습니다.";
            } else {
                if ($error) $error.textContent = "잠시 후 다시 시도해주세요.";
            }
            return;
        }
        const json = await res.json();
        localStorage.setItem("user_id", json.data.user_id);
        localStorage.setItem("nickname", json.data.nickname);
        localStorage.setItem("access_token", json.data.access_token);
        localStorage.setItem("profile_image_url", json.data.profile_image_url);
        closeLoginModal();
        location.reload();
    } catch {
        if ($error) $error.textContent = "네트워크 오류가 발생했습니다.";
    }
}
