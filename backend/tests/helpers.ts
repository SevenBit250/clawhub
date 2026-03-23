import { beforeAll } from "vitest";

export const API_BASE = "http://localhost:3001";

let _authToken: string | undefined;

export async function getAuthToken(): Promise<string> {
  if (_authToken) return _authToken;

  const res = await fetch(`${API_BASE}/auth/callback?code=mock_admin`);
  if (!res.ok) {
    throw new Error(`Failed to get auth token: ${res.status}`);
  }
  const data = await res.json();
  _authToken = data.token;
  return _authToken;
}

export function authHeaders(token?: string) {
  return {
    Authorization: `Bearer ${token ?? ""}`,
  };
}

export function jsonHeaders(token?: string) {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

export async function fetchJson<T = unknown>(
  url: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {};
  const headers = token ? jsonHeaders(token) : undefined;

  const res = await fetch(url, { ...fetchOptions, headers });
  const data = await res.json();
  return { ...data, status: res.status } as T & { status: number };
}

export async function setupAuthToken() {
  beforeAll(async () => {
    await getAuthToken();
  });
}
