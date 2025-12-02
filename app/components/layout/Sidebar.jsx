import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../providers/auth-context";
import { LoginModal } from "../auth/LoginModal";
import {
  readRecentPosts,
  subscribeRecentPosts,
  removeRecentPost,
} from "../../features/posts/utils/recent-posts";

export function Sidebar({ collapsed = false }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    setRecentPosts(readRecentPosts());
    const unsubscribe = subscribeRecentPosts(setRecentPosts);
    return unsubscribe;
  }, []);

  const handleRemoveRecent = (postId) => {
    removeRecentPost(postId);
    setRecentPosts((prev) => prev.filter((item) => item.id !== postId));
  };

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const goToJoin = () => {
    if (!isAuthenticated) {
      navigate("/join");
      return;
    }
  };

  const goToWrite = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    navigate("/posts/new");
  };

  const nickname = user?.nickname ?? "사용자";
  const profileImage = user?.profileImageUrl ?? "/images/profile_placeholder.svg";

  return (
    <aside className={`side ${collapsed ? "collapsed" : ""}`}>
      <div className="side-card side-profile">
        {isAuthenticated ? (
          <div className="side-profile__member">
            <img
              className="profile-thumb"
              data-role="side-profile-image"
              src={profileImage}
              alt="profile"
            />
            <div className="side-profile__name" data-role="side-nickname">
              {nickname}
            </div>
            <div className="side-profile__hint">오늘도 새로운 조각을 부탁해요</div>
            <div className="side-profile__actions">
              <button type="button" data-action="write" onClick={goToWrite}>
                조각 쓰기
              </button>
            </div>
          </div>
        ) : (
          <div className="side-profile__guest">
            <div className="side-profile__guest-title">
              로그인하고 다양한 기능을 이용해보세요!
            </div>
            <div className="side-profile__guest-actions">
              <button
                type="button"
                className="btn-login-guest"
                data-action="login"
                onClick={openLoginModal}
              >
                로그인
              </button>
              <button type="button" className="btn-join-guest" onClick={goToJoin}>
                회원가입
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="recent-posts-card__header">최근 본 조각</div>
      {recentPosts.length ? (
        <>
          <div className="side-card recent-posts-card">
            <ul>
              {recentPosts.map((item) => (
                <li key={item.id}>
                  <div className="recent-posts-card__row">
                    <button type="button" onClick={() => navigate(`/posts/${item.id}`)}>
                      <div className="recent-posts-card__thumb">
                        <img
                          src={item.thumbnail_image_url || "/images/post_placeholder.svg"}
                          alt=""
                          loading="lazy"
                        />
                      </div>
                      <div className="recent-posts-card__body">
                        <div className="recent-posts-card__title">{item.title}</div>
                        <div className="recent-posts-card__meta">
                          {item.user_nickname ?? item.userNickname ?? item.author_nickname ?? "익명"}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="recent-posts-card__remove"
                      aria-label="최근 목록에서 제거"
                      onClick={() => handleRemoveRecent(item.id)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
      <LoginModal open={loginModalOpen} onClose={closeLoginModal} />
    </aside>
  );
}
