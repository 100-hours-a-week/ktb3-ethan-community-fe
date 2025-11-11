import { isLoggedIn } from "./auth.js";
import { __getFetch, __patchFetch, __deleteFetch } from "./api.js";
import { __validateInputNickname, msg } from "./validation.js";

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.replace("/page/login.html");
        return;
    }

    initProfilePage();
});

function initProfilePage() {
    const nicknameInput = document.getElementById("inputNickname");
    const hint = document.getElementById("hintNickname");
    const editBtn = document.querySelector(".profile-edit-button");
    const withdrawBtn = document.querySelector(".withdraw-button");
    const toast = document.querySelector(".profile-edit-success-toast-msg");

    if (!nicknameInput || !hint || !editBtn || !withdrawBtn || !toast) return;

    loadUserProfile();

    nicknameInput.addEventListener("input", () => {
        const result = __validateInputNickname(nicknameInput.value);
        hint.textContent = result.ok ? "" : result.msg;
        toggleEditButton(editBtn, result.ok);
    });

    editBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const result = __validateInputNickname(nicknameInput.value);
        if (!result.ok) {
            hint.textContent = result.msg;
            return;
        }

        const payload = {
            nickname: nicknameInput.value.trim(),
            profileImageUrl: document.getElementById("profileImageUrl")?.value ?? ""
        };

        const res = await __patchFetch("/users", payload);
        if (res.status === 409) {
            hint.textContent = msg["duplicate-nickname"];
            return;
        }

        if (res.ok) {
            showToast(toast);
        }
    });

    withdrawBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const res = await __deleteFetch("/users");
        if (res.status === 204) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("nickname");
            localStorage.removeItem("profile_image_url");
            window.location.replace("/page/login.html");
        }
    });
}

function toggleEditButton(button, isValid) {
    button.classList.toggle("profile-edit-button-enabled", isValid);
    button.classList.toggle("profile-edit-button-disabled", !isValid);
    button.disabled = !isValid;
}

function showToast(toast) {
    toast.classList.remove("hide");
    toast.classList.add("show");
    toast.style.animation = "toast-slide 2s ease forwards";
    setTimeout(() => {
        toast.classList.add("hide");
        toast.classList.remove("show");
    }, 2000);
}

async function loadUserProfile() {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await __getFetch(`/users/${userId}`);
    if (!res.ok) return;
    const json = await res.json().catch(() => null);
    if (!json?.data) return;

    const emailView = document.getElementById("email-view");
    if (emailView) {
        emailView.textContent = json.data.email ?? "";
    }

    const nicknameInput = document.getElementById("inputNickname");
    if (nicknameInput) {
        nicknameInput.value = json.data.nickname ?? "";
    }
}
