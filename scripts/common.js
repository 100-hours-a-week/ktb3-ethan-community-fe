import { findDom } from "./util.js";
import { logOut, isLoggedIn } from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
});

function initHeader() {
    const $header = findDom('.header-wrapper');
    const $profileWrapper = findDom('.header-right');

    if ($profileWrapper && isLoggedIn()) {
        initProfileDropdown($profileWrapper);
    } else {
        $profileWrapper.classList.add('hide');
    }
    initSidebarToggle();
    initHeaderScrollBehavior($header);
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
    const $side = findDom(".side");
    const $page = findDom(".posts-page");

    const setCollapsed = (collapsed) => {
        $toggleIcon.classList.toggle('icon-select', !collapsed)
        $side.classList.toggle("collapsed", collapsed);
        $page.classList.toggle("side-collapsed", collapsed);
    };

    $toggle.addEventListener("click", () => {
        const collapsed = !$side.classList.contains("collapsed");
        setCollapsed(collapsed);
    });
}

function initHeaderScrollBehavior($header) {
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
