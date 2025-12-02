import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./auth-context";
import { apiClient } from "../services/api-client";
import { withCsrf } from "../services/csrf";
import { authStorage } from "../services/auth-storage";

const DEFAULT_SESSION = {
  token: null,
  user: null,
};

const STATUS = {
  CHECKING: "checking",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  LOADING: "loading",
};

async function readError(response) {
  try {
    const data = await response.clone().json();
    return data?.message ?? "요청에 실패했습니다.";
  } catch {
    return response.statusText || "요청에 실패했습니다.";
  }
}

const getInitialSession = () => ({
  token: null,
  user: authStorage.readUser(),
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getInitialSession);
  const [status, setStatus] = useState(STATUS.CHECKING);
  const refreshPromise = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = authStorage.readUser();
    if (storedUser) {
      setSession((prev) => ({
        token: prev.token,
        user: storedUser,
      }));
    }
  }, []);

  const updateSession = useCallback((updater) => {
    setSession((prev) => {
      const nextValue =
        typeof updater === "function" ? updater(prev) : updater ?? DEFAULT_SESSION;
      const normalized = {
        token: nextValue?.token ?? null,
        user: nextValue?.user ?? null,
      };
      if (normalized.token) {
        authStorage.setToken(normalized.token);
      } else {
        authStorage.setToken(null);
      }
      authStorage.saveUser(normalized.user);
      return normalized;
    });
  }, []);

  const setUser = useCallback(
    (user) => {
      updateSession((prev) => ({
        token: prev.token,
        user: user ?? null,
      }));
    },
    [updateSession]
  );

  const attachAuthHeader = useCallback((headers = {}) => {
    const token = authStorage.getToken();
    if (!token) return headers;
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const prepareRequest = useCallback(
    async (path, options = {}) => {
      const baseOptions = {
        method: options.method ? options.method.toUpperCase() : "GET",
        headers: {
          ...(options.headers ?? {}),
        },
        body: options.body,
      };

      if (baseOptions.body && !(baseOptions.body instanceof FormData)) {
        if (typeof baseOptions.body !== "string") {
          baseOptions.body = JSON.stringify(baseOptions.body);
        }
        if (!baseOptions.headers["Content-Type"]) {
          baseOptions.headers["Content-Type"] = "application/json";
        }
      }

      if (baseOptions.body instanceof FormData) {
        delete baseOptions.headers["Content-Type"];
      }

      const csrfSafeOptions = await withCsrf(apiClient, path, baseOptions);
      return {
        ...csrfSafeOptions,
        headers: attachAuthHeader(csrfSafeOptions.headers),
      };
    },
    [attachAuthHeader]
  );

  const refreshSession = useCallback(async () => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    refreshPromise.current = (async () => {
      try {
        const options = await withCsrf(apiClient, "/auth/refresh", {
          method: "POST",
        });
        const res = await apiClient.request("/auth/refresh", options);
        if (!res.ok) throw new Error("refresh failed");
        const json = await res.json().catch(() => null);
        const token = json?.data?.access_token ?? null;
        if (!token) throw new Error("token missing");
        updateSession((prev) => ({
          token,
          user: prev.user,
        }));
        setStatus(STATUS.AUTHENTICATED);
        return true;
      } catch {
        updateSession(DEFAULT_SESSION);
        setStatus(STATUS.UNAUTHENTICATED);
        return false;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [updateSession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (payload) => {
      setStatus(STATUS.LOADING);
      const options = await prepareRequest("/auth/login", {
        method: "POST",
        body: payload,
      });
      const res = await apiClient.request("/auth/login", options);
      if (!res.ok) {
        const message = await readError(res);
        setStatus(STATUS.UNAUTHENTICATED);
        throw new Error(message);
      }
      const json = await res.json().catch(() => null);
      const token = json?.data?.access_token ?? null;
      if (!token) {
        setStatus(STATUS.UNAUTHENTICATED);
        throw new Error("로그인 토큰을 확인할 수 없습니다.");
      }
      updateSession({
        token,
        user: {
          nickname: json?.data?.nickname ?? "",
          email: json?.data?.email ?? "",
          profileImageUrl: json?.data?.profile_image_url ?? "/images/profile_placeholder.svg",
          id: json?.data?.user_id ?? null,
        },
      });
      setStatus(STATUS.AUTHENTICATED);
      return json?.data;
    },
    [prepareRequest, updateSession]
  );

  const logout = useCallback(async () => {
    try {
      const opts = await prepareRequest("/auth/logout", { method: "POST" });
      await apiClient.request("/auth/logout", opts);
    } catch {
      // best-effort
    } finally {
      updateSession(DEFAULT_SESSION);
      setStatus(STATUS.UNAUTHENTICATED);
    }
  }, [prepareRequest, updateSession]);

  const fetchWithAuth = useCallback(
    async (path, options = {}) => {
      const requestOptions = await prepareRequest(path, options);
      let response = await apiClient.request(path, requestOptions);
      if (response.status !== 401) {
        return response;
      }

      const refreshed = await refreshSession();
      if (!refreshed) {
        updateSession(DEFAULT_SESSION);
        setStatus(STATUS.UNAUTHENTICATED);
        return response;
      }

      const retryOptions = await prepareRequest(path, options);
      return apiClient.request(path, retryOptions);
    },
    [prepareRequest, refreshSession, updateSession]
  );

  const value = useMemo(
    () => ({
      status,
      user: session.user,
      token: session.token,
      isAuthenticated: status === STATUS.AUTHENTICATED,
      login,
      logout,
      refresh: refreshSession,
      fetchWithAuth,
      setUser,
    }),
    [fetchWithAuth, login, logout, refreshSession, session.token, session.user, setUser, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
