import type { NextFunction, Request, Response } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';

import { env } from '../config/env.js';
import { redis } from '../lib/redis.js';
import { AppError } from '../utils/AppError.js';

let ready: Promise<void> | undefined;

function ensureRedis(): Promise<void> {
  if (!ready) {
    ready = redis.connect().catch(() => undefined);
  }
  return ready;
}

const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: env.AUTH_RATE_LIMIT_POINTS,
  duration: env.AUTH_RATE_LIMIT_DURATION_SECONDS,
});

/**
 * Per-IP rate limit for auth endpoints to slow credential stuffing.
 */
export async function authRateLimiter(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await ensureRedis();
    await authLimiter.consume(req.ip || 'unknown');
    next();
  } catch (err) {
    if (err instanceof Error && 'msBeforeNext' in err) {
      next(
        new AppError('Too many auth attempts', {
          statusCode: 429,
          code: 'RATE_LIMITED',
        }),
      );
      return;
    }
    next();
  }
}
