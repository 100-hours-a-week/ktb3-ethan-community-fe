const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const defaultHeaders = {
  Accept: "application/json",
};

const buildRequest = (baseUrl, { credentials }) => {
  return async (path, { method = "GET", headers = {}, body, signal } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials,
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body,
      signal,
    });

    return response;
  };
};

export const createApiClient = ({ baseUrl = DEFAULT_BASE_URL } = {}) => {
  const request = buildRequest(baseUrl, { credentials: "include" });
  const requestPublic = buildRequest(baseUrl, { credentials: "include" });
  return { request, requestPublic, baseUrl };
};

export const apiClient = createApiClient();
