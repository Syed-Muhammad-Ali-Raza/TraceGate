import { API_PREFIX } from '@llm-gateway/shared';

import { apiFetch } from '@/lib/api-client';

export async function listApiKeys() {
  return apiFetch<{ keys: Array<Record<string, unknown>> }>(`${API_PREFIX}/api-keys`);
}

export async function createApiKey(name: string) {
  return apiFetch<{ key: Record<string, unknown>; rawKey: string }>(`${API_PREFIX}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function listRequests(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<{ items: Array<Record<string, unknown>>; nextCursor: string | null }>(
    `${API_PREFIX}/requests${q}`,
  );
}

export async function getAnalytics() {
  return apiFetch<{ hourly: Array<Record<string, unknown>>; daily: Array<Record<string, unknown>> }>(
    `${API_PREFIX}/analytics`,
  );
}

export async function upsertProviderKey(provider: 'openai' | 'anthropic', apiKey: string) {
  return apiFetch<{ ok: boolean }>(`${API_PREFIX}/provider-keys`, {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });
}
