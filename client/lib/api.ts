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

  const response = await fetch(`${API_URL}${endpoint}`, {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};