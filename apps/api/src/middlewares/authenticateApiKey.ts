import type { NextFunction, Request, Response } from 'express';

import { sha256 } from '../lib/crypto.js';
import { apiKeyRepository } from '../modules/api-keys/api-keys.repository.js';
import { assertWithinBudget } from '../modules/proxy/budget.service.js';
import { consumeApiKeyRateLimit } from '../modules/proxy/ratelimit.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * Authenticates gateway traffic via Authorization: Bearer lgw_live_...
 * Also enforces per-key rate limits and monthly budget caps.
 */
export async function authenticateApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.get('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) {
      throw new AppError('API key required', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const raw = match[1].trim();
    const found = await apiKeyRepository.findByHash(sha256(raw));
    if (!found) {
      throw new AppError('Invalid API key', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    if (found.key.expiresAt && found.key.expiresAt.getTime() < Date.now()) {
      throw new AppError('API key expired', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    await consumeApiKeyRateLimit(found.key.id, found.key.rateLimit);
    await assertWithinBudget(found.key.id, found.key.budgetUsd);

    req.apiKey = {
      id: found.key.id,
      projectId: found.project.id,
      rateLimit: found.key.rateLimit,
      budgetUsd: found.key.budgetUsd,
      cacheTtl: found.project.cacheTtl,
    };
    void apiKeyRepository.touch(found.key.id);
    next();
  } catch (err) {
    next(err);
  }
}
