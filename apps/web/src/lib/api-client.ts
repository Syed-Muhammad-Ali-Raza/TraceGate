import { env } from '@/lib/env';

const API_URL = env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
};

/**
 * Fetch wrapper with credentials and CSRF header for state-changing requests.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
    const csrf = readCookie('lgw_csrf');
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.message ?? 'Request failed',
      res.status,
      body.error?.code ?? 'REQUEST_FAILED',
    );
  }
  return body.data;
}
