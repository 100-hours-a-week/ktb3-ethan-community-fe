import { AppLayout } from "../components/layout/AppLayout";
import { Header } from "../components/layout/Header";
import { CommunityBanner } from "../components/layout/CommunityBanner";
import { Sidebar } from "../components/layout/Sidebar";
import { JoinForm } from "../components/auth/JoinForm";

export function meta() {
  return [
    { title: "회원가입 - 하루 조각" },
    { name: "description", content: "하루 조각 커뮤니티 회원가입 페이지" },
  ];
}

export default function JoinRoute() {
  return (
    <AppLayout Header={Header} Banner={CommunityBanner} Sidebar={Sidebar}>
      <JoinForm />
    </AppLayout>
  );
}
