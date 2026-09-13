import { logout } from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

export const api = async <T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> => {
  const { token, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...headers,
      },
    });
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Network error: ${err.message}`
        : "Failed to connect to the server."
    );
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    // Automatically purge session and redirect to /login on 401 Unauthorized
    if (response.status === 401 && !endpoint.startsWith("/auth/login")) {
      logout();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error(
        data.message || "Your session has expired. Please sign in again."
      );
    }

    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};