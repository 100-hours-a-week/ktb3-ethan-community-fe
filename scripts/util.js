export function formatDateForCard(dateString) {
    if (!dateString) return "";
    return dateString.slice(0, 19).replace("T", " ");
}

export function setTextContent(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? "";
}

export function formatCountForCard(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    if (num >= 100000) return `${Math.floor(num / 1000)}k`;
    if (num >= 10000) return `${Math.floor(num / 1000)}k`;
    if (num >= 1000) return `${Math.floor(num / 1000)}k`;
    return num;
}

export function findDom(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return el;
}

// export function findDom($parentEl, selector) {
//     const el = $parentEl.querySelector(selector);
//     if (!el) throw new Error(`Element not found: ${selector}`);
//     return el;
// }
