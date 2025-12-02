import { Navigate } from "react-router";
import { useAuth } from "../../providers/auth-context";

export function RequireAuth({ children }) {
  const { isAuthenticated, status } = useAuth();

  if (status === "checking") {
    return <div className="auth-form">인증 상태를 확인 중입니다...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
