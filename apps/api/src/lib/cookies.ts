import type { SerializeOptions } from 'cookie';
import { serialize } from 'cookie';
import type { Response } from 'express';

import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'lgw_access';
export const REFRESH_COOKIE = 'lgw_refresh';
export const CSRF_COOKIE = 'lgw_csrf';

const baseCookie: SerializeOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  path: '/',
  sameSite: env.COOKIE_SAME_SITE,
};

/**
 * Parses a Cookie header into a simple key/value map.
 */
export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [rawKey, ...rest] = part.trim().split('=');
      return [rawKey ?? '', decodeURIComponent(rest.join('=') || '')];
    }),
  );
}

/**
 * Sets auth cookies in one place so expiry/path rules stay consistent.
 */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string },
): void {
  const refreshMaxAge = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

  res.appendHeader(
    'Set-Cookie',
    serialize(ACCESS_COOKIE, tokens.accessToken, {
      ...baseCookie,
      maxAge: env.JWT_ACCESS_TTL_SECONDS,
    }),
  );

  res.appendHeader(
    'Set-Cookie',
    serialize(REFRESH_COOKIE, tokens.refreshToken, {
      ...baseCookie,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: refreshMaxAge,
    }),
  );

  res.appendHeader(
    'Set-Cookie',
    serialize(CSRF_COOKIE, tokens.csrfToken, {
      httpOnly: false,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: '/',
      maxAge: refreshMaxAge,
    }),
  );
}

/**
 * Clears all auth cookies on logout.
 */
export function clearAuthCookies(res: Response): void {
  const expired: SerializeOptions = {
    ...baseCookie,
    maxAge: 0,
  };

  res.appendHeader('Set-Cookie', serialize(ACCESS_COOKIE, '', expired));
  res.appendHeader(
    'Set-Cookie',
    serialize(REFRESH_COOKIE, '', {
      ...expired,
      sameSite: 'strict',
      path: '/api/v1/auth',
    }),
  );
  res.appendHeader(
    'Set-Cookie',
    serialize(CSRF_COOKIE, '', {
      httpOnly: false,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: '/',
      maxAge: 0,
    }),
  );
}
