import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { serialize } from 'cookie';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { env } from '../config/env.js';
import { CSRF_COOKIE, parseCookies } from '../lib/cookies.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

function signCsrf(token: string): string {
  return createHmac('sha256', env.CSRF_SECRET).update(token).digest('base64url');
}

function issueCsrfToken(): string {
  const token = randomBytes(24).toString('base64url');
  return `${token}.${signCsrf(token)}`;
}

function isValidCsrf(token: string): boolean {
  const [raw, sig] = token.split('.');
  if (!raw || !sig) {
    return false;
  }
  const expected = signCsrf(raw);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Double-submit CSRF: cookie value must match X-CSRF-Token on state-changing routes.
 */
export function csrfProtect(req: Request, _res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token') ?? '';

  if (!cookieToken || !headerToken || cookieToken !== headerToken || !isValidCsrf(cookieToken)) {
    next(
      new AppError('CSRF validation failed', {
        statusCode: 403,
        code: 'CSRF_FAILED',
      }),
    );
    return;
  }

  next();
}

/**
 * Issues a signed CSRF cookie for the SPA to read and echo back.
 */
export const csrfIssueHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const token = issueCsrfToken();
  res.appendHeader(
    'Set-Cookie',
    serialize(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: '/',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    }),
  );
  sendSuccess(res, { csrfToken: token });
});
