interface FetchOptions extends RequestInit {
  token?: string | null
}

export function useApi() {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase as string || 'http://localhost:3001'

  async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  return {
    get: <T>(path: string, options?: FetchOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
      request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
      request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: FetchOptions) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  }
}
