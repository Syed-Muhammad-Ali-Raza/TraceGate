import { and, eq } from 'drizzle-orm';
import {
  experimentVariants,
  experiments,
  orgMembers,
  projects,
  promptVersions,
  prompts,
} from '@llm-gateway/db';

import { db } from '../../lib/db.js';

export class ExperimentsRepository {
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
    return db.select().from(experiments).where(eq(experiments.projectId, projectId));
  }

  async create(input: { projectId: string; name: string }) {
    const [row] = await db.insert(experiments).values(input).returning();
    return row!;
  }

  async addVariant(input: {
    experimentId: string;
    promptVersionId: string;
    trafficPct: number;
  }) {
    const [row] = await db.insert(experimentVariants).values(input).returning();
    return row!;
  }

  async activate(experimentId: string, projectId: string) {
    await db
      .update(experiments)
      .set({ status: 'running' })
      .where(and(eq(experiments.id, experimentId), eq(experiments.projectId, projectId)));
  }

  async getRunningWithVariants(projectId: string) {
    const expRows = await db
      .select()
      .from(experiments)
      .where(and(eq(experiments.projectId, projectId), eq(experiments.status, 'running')))
      .limit(1);
    const exp = expRows[0];
    if (!exp) {
      return null;
    }
    const variants = await db
      .select({
        variant: experimentVariants,
        version: promptVersions,
        prompt: prompts,
      })
      .from(experimentVariants)
      .innerJoin(promptVersions, eq(promptVersions.id, experimentVariants.promptVersionId))
      .innerJoin(prompts, eq(prompts.id, promptVersions.promptId))
      .where(eq(experimentVariants.experimentId, exp.id));
    return { experiment: exp, variants };
  }
}

export const experimentsRepository = new ExperimentsRepository();
