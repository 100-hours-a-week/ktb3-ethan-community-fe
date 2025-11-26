import { findDom, findDomOrNull } from "./util.js";
import { logOut, isLoggedIn } from "./auth.js";
import { initSideProfileCard } from './sidebar.js'
import { __postFetch } from "./api.js";
import { __validateInputPassword, __validateInputEmail, msg } from "./validation.js";


export function initCommonLayout() {

    const authed = isLoggedIn();

    initHeader(authed);
    initSideProfileCard(authed);
    reRender(authed);
    initAuthRequiredHandler();
}


function initHeader(authed) {
    initSidebarToggle();

    const $profileWrapper = findDomOrNull('.header-right');
    if (authed && $profileWrapper && isLoggedIn()) {
        initProfileDropdown($profileWrapper);
        initHeaderProfile();
    } else {
        $profileWrapper.classList.add('hide');
    }

    const $header = findDom('.header-wrapper');
    handlerHeaderScrollBehavior($header);
}

function initHeaderProfile() {
    const $profileImage = findDomOrNull('#open-profile-settings');
    const url = localStorage.getItem('profile_image_url');
    if ($profileImage) {
        if (url && url.trim() !== "" && url !== "dummy link") {
            $profileImage.src = url;
        } else {
            $profileImage.src = "/images/profile_placeholder.svg";
        }
    }
}

function initProfileDropdown($wrapper) {
    $wrapper.classList.remove('hide');

    const $profileMenu = findDom('.profile-menu');

    $wrapper.addEventListener("click", (event) => {
        event.stopPropagation();
        $profileMenu.classList.toggle("hide");
    });

    $profileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = e.target.dataset.action;
        if (!action) return;

        if (action === "profile-edit") {
            window.location.href = "/page/profileEdit.html";
        } else if (action === "password-change") {
            window.location.href = "/page/passwordChange.html";
        } else if (action === "logout") {
            logOut();
            $profileMenu.classList.toggle("hide");
            $wrapper.classList.toggle("hide");
            window.location.replace("/index.html");
        }
        $profileMenu.classList.toggle("hide");
    });
}


function initSidebarToggle() {
    const $toggle = findDom('#sidebar-toggle');
    const $toggleIcon = findDom('#sidebar-toggle svg');
    const $side = findDomOrNull('.side');
    const $page = findDomOrNull('.page');

    if (!$side) {
        // 만약 사이드가 없다면 사이드 버튼은 숨김고 이벤드 등록 종료
        $toggle.classList.add('hide');
        return;
    }

    const setCollapsed = (collapsed) => {
        $toggleIcon.classList.toggle('icon-select', !collapsed)
        $side.classList.toggle("collapsed", collapsed);
        if ($page) {
            $page.classList.toggle("side-collapsed", collapsed);
        }
    };

    $toggle.addEventListener("click", () => {
        const collapsed = !$side.classList.contains("collapsed");
        setCollapsed(collapsed);
    });
}


function handlerHeaderScrollBehavior($header) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY;

        if (currentY <= 20) {
            $header.classList.remove("header-hidden");
        } else if (diff > 5) {
            $header.classList.add("header-hidden");
        } else if (diff < -5) {
            $header.classList.remove("header-hidden");
        }

        lastScrollY = currentY;
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
        }
    }, { passive: true });
}


function reRender(authed) {
    updateDataAuthOnly(authed);
}


function updateDataAuthOnly(authed) {
    document.querySelectorAll("[data-auth-only]").forEach(el => {
        el.classList.toggle("hide", !authed);
    });
    document.querySelectorAll("[data-auth-guest]").forEach(el => {
        el.classList.toggle("hide", authed);
    });
}

function initAuthRequiredHandler() {
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-auth-only]");
        if (!target) return;
        if (isLoggedIn()) return;
        e.preventDefault();
        e.stopPropagation();
        // openGlobalLoginModal();
    });
}
