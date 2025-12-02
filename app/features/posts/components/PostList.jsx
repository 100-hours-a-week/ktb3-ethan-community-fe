import { useEffect, useRef } from "react";
import { useInfinitePosts } from "../hooks/useInfinitePosts";
import { useMasonryColumns } from "../hooks/useMasonryColumns";
import { PostCard } from "./PostCard";

export function PostList() {
  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);
  const { posts, loadMore, hasMore, loading, error, isEmpty } = useInfinitePosts();
  const { containerRef, columns } = useMasonryColumns(posts);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      {
        root: scrollRootRef.current,
        rootMargin: "300px 0px",
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const retryLoad = () => {
    loadMore();
  };

  return (
    <div className="posts-wrapper" ref={scrollRootRef}>
      <section id="posts-view" ref={containerRef}>
        {columns.map((column, columnIndex) => (
          <div className="posts-column" key={`column-${columnIndex}`}>
            {column.map((post, index) => (
              <PostCard
                key={post.id ?? `column-${columnIndex}-card-${index}`}
                post={post}
              />
            ))}
          </div>
        ))}
      </section>
      {error ? (
        <div className="posts-state posts-state--error">
          <div className="posts-state__icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" />
              <line x1="24" y1="14" x2="24" y2="28" />
              <circle cx="24" cy="34" r="2.5" />
            </svg>
          </div>
          <div className="posts-state__body">
            <h3>조각을 불러오지 못했어요</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={retryLoad}>
            다시 시도
          </button>
        </div>
      ) : null}
      <div id="sentinel" ref={sentinelRef}>
        {loading ? "조각을 불러오는 중..." : !hasMore ? "마지막 조각입니다." : ""}
      </div>
    </div>
  );
}
