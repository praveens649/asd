const TOKEN_KEY = "project_management_token";
const USER_KEY = "project_management_user";

import { User } from "./types";

export const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const { exp } = JSON.parse(jsonPayload);
    if (typeof exp === "number") {
      return Date.now() >= exp * 1000;
    }
    return false;
  } catch {
    return true;
  }
};

export const saveAuth = (
  token: string,
  user: User
) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  if (isTokenExpired(token)) {
    logout();
    return null;
  }

  return token;
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return Boolean(getToken());
};