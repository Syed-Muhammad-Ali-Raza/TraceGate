import { z } from 'zod';

import { encryptSecret, generateApiKey } from '../../lib/crypto.js';
import { AppError } from '../../utils/AppError.js';
import { apiKeyRepository } from './api-keys.repository.js';

export const createApiKeySchema = z
  .object({
    name: z.string().min(1).max(120),
    rateLimit: z.number().int().positive().optional(),
  })
  .strict();

export const upsertProviderKeySchema = z
  .object({
    provider: z.enum(['openai', 'anthropic']),
    apiKey: z.string().min(10).max(500),
  })
  .strict();

export class ApiKeyService {
  /**
   * Creates a gateway key; returns the plaintext once.
   */
  async create(userId: string, input: z.infer<typeof createApiKeySchema>) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      throw new AppError('No project found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    const generated = generateApiKey();
    const row = await apiKeyRepository.create({
      projectId: project.id,
      name: input.name,
      keyHash: generated.hash,
      keyPrefix: generated.prefix,
      rateLimit: input.rateLimit,
    });
    return { key: row, rawKey: generated.raw };
  }

  async list(userId: string) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      return [];
    }
    return apiKeyRepository.listByProject(project.id);
  }

  async revoke(userId: string, id: string) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      throw new AppError('No project found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    await apiKeyRepository.revoke(id, project.id);
  }

  async listProviderKeys(userId: string) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      return [];
    }
    return apiKeyRepository.listProviderKeys(project.id);
  }

  async upsertProviderKey(userId: string, input: z.infer<typeof upsertProviderKeySchema>) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      throw new AppError('No project found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    const enc = encryptSecret(input.apiKey);
    await apiKeyRepository.upsertProviderKey({
      projectId: project.id,
      provider: input.provider,
      ...enc,
    });
    return { ok: true };
  }
}

export const apiKeyService = new ApiKeyService();
