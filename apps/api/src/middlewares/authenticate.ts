import type { NextFunction, Request, Response } from 'express';

import { ACCESS_COOKIE, parseCookies } from '../lib/cookies.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verifies the httpOnly access JWT cookie and attaches req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ACCESS_COOKIE];
    if (!token) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const payload = await verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(
      new AppError('Invalid or expired access token', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  }
}

/**
 * Optional auth: attaches user when cookie present, otherwise continues.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ACCESS_COOKIE];
    if (!token) {
      next();
      return;
    }
    const payload = await verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next();
  }
}
