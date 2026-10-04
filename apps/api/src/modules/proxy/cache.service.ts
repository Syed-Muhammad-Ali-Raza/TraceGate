import { createHash } from 'node:crypto';

import { redis } from '../../lib/redis.js';

export function cacheKey(model: string, body: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify({ model, body })).digest('hex');
  return `cache:llm:${hash}`;
}

/**
 * Returns cached JSON response when present. Only used for deterministic requests.
 */
export async function getCachedResponse(key: string): Promise<unknown | null> {
  try {
    await redis.connect().catch(() => undefined);
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (ttlSeconds <= 0) {
    return;
  }
  try {
    await redis.connect().catch(() => undefined);
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}
