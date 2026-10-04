import { and, eq, isNull } from 'drizzle-orm';
import { apiKeys, orgMembers, projects, providerKeys } from '@llm-gateway/db';

import { db } from '../../lib/db.js';

export class ApiKeyRepository {
  async listByProject(projectId: string) {
    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        budgetUsd: apiKeys.budgetUsd,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.projectId, projectId), isNull(apiKeys.revokedAt)));
  }

  async create(input: {
    projectId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    rateLimit?: number;
  }) {
    const [row] = await db.insert(apiKeys).values(input).returning();
    return row!;
  }

  async revoke(id: string, projectId: string) {
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.projectId, projectId)));
  }

  async findByHash(keyHash: string) {
    const rows = await db
      .select({
        key: apiKeys,
        project: projects,
      })
      .from(apiKeys)
      .innerJoin(projects, eq(projects.id, apiKeys.projectId))
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async touch(id: string) {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async listProviderKeys(projectId: string) {
    return db
      .select({
        id: providerKeys.id,
        provider: providerKeys.provider,
        createdAt: providerKeys.createdAt,
      })
      .from(providerKeys)
      .where(eq(providerKeys.projectId, projectId));
  }

  async upsertProviderKey(input: {
    projectId: string;
    provider: string;
    encryptedKey: string;
    iv: string;
    tag: string;
  }) {
    const existing = await db
      .select()
      .from(providerKeys)
      .where(
        and(eq(providerKeys.projectId, input.projectId), eq(providerKeys.provider, input.provider)),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(providerKeys)
        .set({
          encryptedKey: input.encryptedKey,
          iv: input.iv,
          tag: input.tag,
        })
        .where(eq(providerKeys.id, existing[0].id))
        .returning();
      return row!;
    }

    const [row] = await db.insert(providerKeys).values(input).returning();
    return row!;
  }

  async getProviderKey(projectId: string, provider: string) {
    const rows = await db
      .select()
      .from(providerKeys)
      .where(and(eq(providerKeys.projectId, projectId), eq(providerKeys.provider, provider)))
      .limit(1);
    return rows[0] ?? null;
  }

  async firstProjectForUser(userId: string) {
    const rows = await db
      .select({ project: projects })
      .from(orgMembers)
      .innerJoin(projects, eq(projects.orgId, orgMembers.orgId))
      .where(eq(orgMembers.userId, userId))
      .limit(1);
    return rows[0]?.project ?? null;
  }
}

export const apiKeyRepository = new ApiKeyRepository();
