const TOKEN_KEY = "project_management_token";
const USER_KEY = "project_management_user";

import { User } from "./types";

export const saveAuth = (
  token: string,
  user: User
) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
};

export const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem(USER_KEY);

  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};