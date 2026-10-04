import { RateLimiterRedis } from 'rate-limiter-flexible';

import { redis } from '../../lib/redis.js';
import { AppError } from '../../utils/AppError.js';

let connected: Promise<void> | undefined;

function ensureRedis(): Promise<void> {
  if (!connected) {
    connected = redis.connect().catch(() => undefined);
  }
  return connected;
}

/**
 * Sliding-window per-API-key rate limit (requests per minute).
 */
export async function consumeApiKeyRateLimit(apiKeyId: string, pointsPerMinute: number): Promise<void> {
  await ensureRedis();
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:apikey',
    points: Math.max(1, pointsPerMinute),
    duration: 60,
  });

  try {
    await limiter.consume(apiKeyId);
  } catch (err) {
    if (err instanceof Error && 'msBeforeNext' in err) {
      throw new AppError('API key rate limit exceeded', {
        statusCode: 429,
        code: 'RATE_LIMITED',
      });
    }
    // Fail open if Redis is down.
  }
}
