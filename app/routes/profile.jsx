import { RequireAuth } from "../components/auth/RequireAuth";
import { ProfileEditForm } from "../features/profile/components/ProfileEditForm";
import { PasswordChangeForm } from "../features/profile/components/PasswordChangeForm";
import { ProfileTabs } from "../features/profile/components/ProfileTabs";

import { AppLayout } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";

export function meta() {
  return [
    { title: "회원정보 수정 - 하루 조각" },
    { name: "description", content: "회원정보 수정" },
  ];
}

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <AppLayout Header={Header} Sidebar={Sidebar}>
        <div className="profile-page">
          <ProfileTabs ProfileForm={ProfileEditForm} PasswordForm={PasswordChangeForm} />
        </div>
      </AppLayout>
    </RequireAuth>
  );
}
