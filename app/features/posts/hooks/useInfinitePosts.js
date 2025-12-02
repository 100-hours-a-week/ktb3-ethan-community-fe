import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../providers/auth-context";
import { fetchPosts } from "../api/posts-api";
import { apiClient } from "../../../services/api-client";

const DEFAULT_LIMIT = 10;

export function useInfinitePosts(limit = DEFAULT_LIMIT) {
  const { fetchWithAuth, isAuthenticated } = useAuth();
  const requestClient = useMemo(
    () => (isAuthenticated ? fetchWithAuth : apiClient.requestPublic),
    [fetchWithAuth, isAuthenticated]
  );
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { posts: newPosts, nextCursor } = await fetchPosts(requestClient, {
        cursor,
        limit,
      });

      setPosts((prev) => [...prev, ...newPosts]);

      const hasNext = !!nextCursor && nextCursor !== cursor && newPosts.length > 0;
      setHasMore(hasNext);
      hasMoreRef.current = hasNext;

      setCursor(nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [cursor, limit, requestClient]);

  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    loadMore();
  }, [loadMore]);

  const derived = useMemo(
    () => ({
      posts,
      loading,
      error,
      hasMore,
      isEmpty: !loading && posts.length === 0,
      loadMore,
    }),
    [error, hasMore, loadMore, loading, posts]
  );

  return derived;
}
