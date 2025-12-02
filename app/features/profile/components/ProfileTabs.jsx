import { useState } from "react";

export function ProfileTabs({ ProfileForm, PasswordForm }) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="profile-tabs-container">
      <div className="profile-tabs">
        <button
          type="button"
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          개인정보수정
        </button>
        <button
          type="button"
          className={activeTab === "password" ? "active" : ""}
          onClick={() => setActiveTab("password")}
        >
          비밀번호변경
        </button>
      </div>
      <div className="profile-tab-content">
        {activeTab === "profile" ? <ProfileForm /> : <PasswordForm />}
      </div>
    </div>
  );
}
