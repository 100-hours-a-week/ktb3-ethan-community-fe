const STORAGE_KEY = "haru-recent-posts";
const SKIP_KEY = "haru-recent-posts-skip";
const RECENT_EVENT = "haru:recent-posts";
const MAX_RECENT = 10;

const safeWindow = typeof window === "undefined" ? null : window;

function readStorage() {
  if (!safeWindow) return [];
  try {
    const raw = safeWindow.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(list) {
  if (!safeWindow) return;
  try {
    safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    safeWindow.dispatchEvent(new CustomEvent(RECENT_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function readRecentPosts() {
  return readStorage();
}

export function upsertRecentPost(post) {
  if (!post || !post.id) return;
  const normalizedId = String(post.id);
  if (consumeSkip(normalizedId)) return;
  const current = readStorage();
  const next = current.filter((item) => String(item.id) !== normalizedId);
  next.unshift({
    id: normalizedId,
    title: post.title ?? "이름 없는 조각",
    thumbnail_image_url: post.thumbnail_image_url ?? null,
    user_nickname:
      post.user_nickname ??
      post.user_nick_name ??
      post.userNickname ??
      post.userNickName ??
      post.author_nickname ??
      "익명",
    created_at: post.created_at ?? null,
  });
  writeStorage(next.slice(0, MAX_RECENT));
}

export function removeRecentPost(postId) {
  if (!postId) return;
  const normalizedId = String(postId);
  const current = readStorage();
  const next = current.filter((item) => String(item.id) !== normalizedId);
  writeStorage(next);
  addSkip(normalizedId);
}

export function subscribeRecentPosts(callback) {
  if (!safeWindow) return () => {};
  const handler = () => {
    callback?.(readStorage());
  };
  safeWindow.addEventListener(RECENT_EVENT, handler);
  safeWindow.addEventListener("storage", handler);
  return () => {
    safeWindow.removeEventListener(RECENT_EVENT, handler);
    safeWindow.removeEventListener("storage", handler);
  };
}

function readSkipList() {
  if (!safeWindow) return [];
  try {
    const raw = safeWindow.localStorage.getItem(SKIP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSkipList(list) {
  if (!safeWindow) return;
  try {
    safeWindow.localStorage.setItem(SKIP_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function addSkip(id) {
  const current = readSkipList();
  if (current.includes(id)) return;
  writeSkipList([...current, id]);
}

function consumeSkip(id) {
  const current = readSkipList();
  if (!current.includes(id)) return false;
  const next = current.filter((item) => item !== id);
  writeSkipList(next);
  return true;
}
