import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../providers/auth-context";
import { getProfileImageOrDefault, getInfoOrDefault } from "../../utils/format.js" 


export function Header({ onToggleSidebar, sidebarCollapsed, hasSidebar = true }) {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);
  const scrollTicking = useRef(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      // 팝업창을 벗어난 클릭
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      window.requestAnimationFrame(() => {
        const delta = currentY - lastScroll.current;
        if (currentY < 40) {
          setHidden(false);
        } else if (delta > 4) {
          setHidden(true);
        } else if (delta < -4) {
          setHidden(false);
        }
        lastScroll.current = currentY;
        scrollTicking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    onToggleSidebar?.();
  }, [onToggleSidebar]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  const goToProfileEdit = () => {
    navigate("/profile");
    setMenuOpen(false);
  };
  
  return (
    <div className={`header-wrapper ${hidden ? "header-hidden" : ""}`}>
      <div className="header-left">
        {hasSidebar ? (
          <HeaderLeftMemo
            onToggleSidebar={handleSidebarToggle}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : null}

        <div className="header-title">
          <a href="/">하루 조각</a>
        </div>
      </div>
      <HeaderRightMemo
        isAuthenticated={isAuthenticated}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((prev) => !prev)}
        menuRef={menuRef}
        goToProfileEdit={goToProfileEdit}
        onLogout={handleLogout}
      />
    </div>
  );
}

const HeaderLeftMemo = memo(function HeaderLeft({ onToggleSidebar, sidebarCollapsed }) {
  return (
      <button
        type="button"
        className={`action-icon ${sidebarCollapsed ? "" : "icon-select"}`}
        id="sidebar-toggle"
        aria-pressed={!sidebarCollapsed}
        onClick={onToggleSidebar}
      >
        <svg
          className={sidebarCollapsed ? "" : "icon-select"}
          width="32"
          height="32"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
  );
});

const HeaderRightMemo = memo(function HeaderRight({
  isAuthenticated,
  menuOpen,
  onToggleMenu,
  menuRef,
  goToProfileEdit,
  onLogout,
}) {

  const {user} = useAuth();


  const profileImage = getProfileImageOrDefault(user);

  return (
    <div className="header-right">
      {isAuthenticated &&
        <> 
          <img
            className="profile-image"
            src={profileImage}
            id="open-profile-settings"
            onClick={onToggleMenu}
          />
          <ProfileDropdown
            menuOpen={menuOpen}
            menuRef={menuRef}
            user={user}
            profileImage={profileImage}
            goToProfileEdit={goToProfileEdit}
            onLogout={onLogout}
          />
        </>
      }
    </div>
  );
});


function ProfileDropdown({
  menuOpen,
  menuRef,
  user,
  profileImage,
  goToProfileEdit,
  onLogout,
}) {
  return (
    <div
      ref={menuRef}
      className={`profile-menu ${menuOpen ? "open" : ""}`}
      aria-hidden={!menuOpen}
    >
      <div className="profile-card">
        <img
          className="profile-image"
          src={profileImage}
        />
        <div>
          <div className="nickname">{getInfoOrDefault(user?.nickname)}</div>
          <div className="email">{getInfoOrDefault(user?.email)}</div>
        </div>
      </div>
      <ProfileAction 
        action={"profile-edit"}
        name={"개인정보 설정"}
        logoUrl={"/public/icon/edit.svg"}
        handleClick={goToProfileEdit}
      />
      <ProfileAction 
        action={"logout"}
        name={"로그아웃"}
        logoUrl={"/public/icon/logout.svg"}
        handleClick={onLogout}
      />
    </div>
  );
}


function ProfileAction({action, name, logoUrl, handleClick}) {
  const onActionClick = (event) => {
    event.stopPropagation();
    handleClick?.();
  };

  return (
    <button type="button" className="action-wrapper" data-action={action} onClick={onActionClick}>
      <img src={logoUrl} className="icon" alt="" />
      <span>{name}</span>
    </button>
  );
}
