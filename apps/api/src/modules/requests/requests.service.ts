import { and, desc, eq, sql } from 'drizzle-orm';
import { llmRequests, usageDaily, usageHourly } from '@llm-gateway/db';

import { db } from '../../lib/db.js';
import { AppError } from '../../utils/AppError.js';
import { apiKeyRepository } from '../api-keys/api-keys.repository.js';

export class RequestsService {
  async list(userId: string, cursor?: string, limit = 50) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      return { items: [], nextCursor: null };
    }

    const conditions = [eq(llmRequests.projectId, project.id)];
    if (cursor) {
      const [createdAt, id] = cursor.split('|');
      if (createdAt && id) {
        conditions.push(
          sql`(${llmRequests.createdAt}, ${llmRequests.id}) < (${new Date(createdAt)}::timestamptz, ${id}::uuid)`,
        );
      }
    }

    const items = await db
      .select()
      .from(llmRequests)
      .where(and(...conditions))
      .orderBy(desc(llmRequests.createdAt), desc(llmRequests.id))
      .limit(limit + 1);

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const last = page[page.length - 1];
    return {
      items: page,
      nextCursor: hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
    };
  }

  async get(userId: string, id: string) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      throw new AppError('Not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    const rows = await db
      .select()
      .from(llmRequests)
      .where(and(eq(llmRequests.id, id), eq(llmRequests.projectId, project.id)))
      .limit(1);
    const row = rows[0];
    if (!row) {
      throw new AppError('Not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return row;
  }

  async analytics(userId: string) {
    const project = await apiKeyRepository.firstProjectForUser(userId);
    if (!project) {
      return { hourly: [], daily: [] };
    }
    const hourly = await db
      .select()
      .from(usageHourly)
      .where(eq(usageHourly.projectId, project.id))
      .orderBy(desc(usageHourly.hour))
      .limit(48);
    const daily = await db
      .select()
      .from(usageDaily)
      .where(eq(usageDaily.projectId, project.id))
      .orderBy(desc(usageDaily.day))
      .limit(30);
    return { hourly, daily };
  }
}

export const requestsService = new RequestsService();
