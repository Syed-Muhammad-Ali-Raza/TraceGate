import { and, eq } from 'drizzle-orm';
import { evalResults, evals, orgMembers, projects } from '@llm-gateway/db';

import { db } from '../../lib/db.js';

export class EvalsRepository {
  async projectForUser(userId: string) {
    const rows = await db
      .select({ project: projects })
      .from(orgMembers)
      .innerJoin(projects, eq(projects.orgId, orgMembers.orgId))
      .where(eq(orgMembers.userId, userId))
      .limit(1);
    return rows[0]?.project ?? null;
  }

  async list(projectId: string) {
    return db.select().from(evals).where(eq(evals.projectId, projectId));
  }

  async create(input: {
    projectId: string;
    name: string;
    judgeModel: string;
    criteria: string;
    sampleRate: number;
  }) {
    const [row] = await db.insert(evals).values(input).returning();
    return row!;
  }

  async get(id: string, projectId: string) {
    const rows = await db
      .select()
      .from(evals)
      .where(and(eq(evals.id, id), eq(evals.projectId, projectId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listResults(evalId: string) {
    return db.select().from(evalResults).where(eq(evalResults.evalId, evalId));
  }

  async insertResult(input: {
    evalId: string;
    requestId: string;
    score: number;
    reasoning: string;
  }) {
    const [row] = await db.insert(evalResults).values(input).returning();
    return row!;
  }
}

export const evalsRepository = new EvalsRepository();
