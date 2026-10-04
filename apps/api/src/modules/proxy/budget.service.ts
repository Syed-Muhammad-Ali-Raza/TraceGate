import { and, eq, gte, sql } from 'drizzle-orm';
import { llmRequests } from '@llm-gateway/db';

import { db } from '../../lib/db.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Enforces monthly USD budget caps per gateway API key.
 */
export async function assertWithinBudget(
  apiKeyId: string,
  budgetUsd: string | null,
): Promise<void> {
  if (!budgetUsd) {
    return;
  }
  const cap = Number(budgetUsd);
  if (!Number.isFinite(cap) || cap <= 0) {
    return;
  }

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      spent: sql<string>`coalesce(sum(${llmRequests.costUsd}), 0)`,
    })
    .from(llmRequests)
    .where(and(eq(llmRequests.apiKeyId, apiKeyId), gte(llmRequests.createdAt, start)));

  const spent = Number(rows[0]?.spent ?? 0);
  if (spent >= cap) {
    throw new AppError('Monthly budget exceeded for this API key', {
      statusCode: 402,
      code: 'BUDGET_EXCEEDED',
      details: { spent, cap },
    });
  }
}
