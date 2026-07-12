export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message: string;
}

const AUTH_TOKEN_STORAGE_KEY = 'assetflow_auth_token';

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload;
}
