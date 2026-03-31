interface FetchOptions extends RequestInit {
  token?: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export function useApi() {
  async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const hasBody = options.body !== undefined && options.body !== null;
    const headers: Record<string, string> = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const body = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(body);
        message = json.message || json.error || message;
      } catch {
        // use default message
      }
      throw Object.assign(new Error(message), { status: response.status, body });
    }

    return response.json();
  }

  return {
    get: <T>(path: string, options?: FetchOptions) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
      request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
      request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: FetchOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}
