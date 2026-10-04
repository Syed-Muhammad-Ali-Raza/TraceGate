import { API_PREFIX } from '@llm-gateway/shared';

import { apiFetch } from '@/lib/api-client';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
};

export async function ensureCsrf(): Promise<void> {
  await apiFetch<{ csrfToken: string }>(`${API_PREFIX}/auth/csrf`);
}

export async function loginRequest(email: string, password: string) {
  await ensureCsrf();
  return apiFetch<{ user: AuthUser }>(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(email: string, password: string, name?: string) {
  await ensureCsrf();
  return apiFetch<{ user: AuthUser }>(`${API_PREFIX}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function meRequest() {
  return apiFetch<{ user: AuthUser }>(`${API_PREFIX}/auth/me`);
}

export async function logoutRequest() {
  await ensureCsrf();
  return apiFetch<{ ok: boolean }>(`${API_PREFIX}/auth/logout`, { method: 'POST' });
}
