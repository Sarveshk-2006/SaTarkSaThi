const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Token management: tokens are stored in sessionStorage (tab-scoped)
 * to prevent long-lived credential leakage in persistent browser storage.
 */
export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem('satark_auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem('satark_auth_token', token);
    } else {
      sessionStorage.removeItem('satark_auth_token');
    }
  } catch {
    // SessionStorage may be restricted in some sandboxed environments
  }
}

export function clearAuth(): void {
  try {
    sessionStorage.removeItem('satark_auth_token');
    sessionStorage.removeItem('satark_auth_user');
  } catch {
    // ignore
  }
}

export function getActiveUserId(): string {
  return localStorage.getItem('satark_active_user_id') || '1';
}

export function setActiveUserId(userId: string | number): void {
  localStorage.setItem('satark_active_user_id', String(userId));
  window.dispatchEvent(new CustomEvent('satark-profile-changed', { detail: { userId: String(userId) } }));
}

export function getAuthHeaders(includeContentType: boolean = true): Record<string, string> {
  const token = getAuthToken();
  const activeUserId = getActiveUserId();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Development/demo persona fallback
    headers['X-User-Id'] = activeUserId;
  }

  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const baseHeaders = getAuthHeaders(true);

  const headers = {
    ...baseHeaders,
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // If unauthorized and a token was used, clear the invalid/expired token
      if (response.status === 401 && getAuthToken()) {
        clearAuth();
      }

      const message =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.details) ? data.details.map((d: any) => d.message).join(', ') : 'Network request failed');
      throw new ApiError(message, response.status, data?.details);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your backend connection.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Unable to connect to Satark Saathi server.', 500);
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
