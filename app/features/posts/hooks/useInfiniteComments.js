import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchComments } from "../api/post-detail-api";
import { useAuth } from "../../../providers/auth-context";
import { apiClient } from "../../../services/api-client";

export function useInfiniteComments(postId, limit = 20) {
  const { fetchWithAuth, isAuthenticated } = useAuth();
  const requestClient = useMemo(
    () => (isAuthenticated ? fetchWithAuth : apiClient.requestPublic),
    [fetchWithAuth, isAuthenticated]
  );
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const runLoad = useCallback(
    async ({ replace } = { replace: false }) => {
      if (!postId || loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const currentCursor = replace ? null : cursorRef.current;
        const { comments: newComments, nextCursor } = await fetchComments(
          requestClient,
          postId,
          {
            cursor: currentCursor,
            limit,
          }
        );

        setComments((prev) => (replace ? newComments : [...prev, ...newComments]));

        const hasNext =
          !!nextCursor && nextCursor !== currentCursor && newComments.length > 0;
        hasMoreRef.current = hasNext;
        setHasMore(hasNext);

        cursorRef.current = nextCursor ?? null;
        setCursor(cursorRef.current);
      } catch (err) {
        setError(err instanceof Error ? err.message : "댓글을 불러오지 못했습니다.");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [limit, postId, requestClient]
  );

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || loadingRef.current) return;
    runLoad({ replace: false });
  }, [runLoad]);

  useEffect(() => {
    if (!postId) return;
    setComments([]);
    setCursor(null);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    runLoad({ replace: true });
  }, [postId, runLoad]);

  const reload = useCallback(() => {
    setComments([]);
    setCursor(null);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    runLoad({ replace: true });
  }, [runLoad]);

  return useMemo(
    () => ({
      comments,
      loading,
      error,
      hasMore,
      loadMore,
      reload,
    }),
    [comments, error, hasMore, loadMore, loading, reload]
  );
}
