import { z } from 'zod';

import { AppError } from '../../utils/AppError.js';
import { experimentsRepository } from './experiments.repository.js';

export const createExperimentSchema = z
  .object({
    name: z.string().min(1).max(120),
  })
  .strict();

export const addVariantSchema = z
  .object({
    promptVersionId: z.string().uuid(),
    trafficPct: z.number().int().min(1).max(100),
  })
  .strict();

export class ExperimentsService {
  async list(userId: string) {
    const project = await experimentsRepository.projectForUser(userId);
    if (!project) {
      return [];
    }
    return experimentsRepository.list(project.id);
  }

  async create(userId: string, input: z.infer<typeof createExperimentSchema>) {
    const project = await experimentsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return experimentsRepository.create({ projectId: project.id, name: input.name });
  }

  async addVariant(
    userId: string,
    experimentId: string,
    input: z.infer<typeof addVariantSchema>,
  ) {
    const project = await experimentsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return experimentsRepository.addVariant({ experimentId, ...input });
  }

  async activate(userId: string, experimentId: string) {
    const project = await experimentsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    await experimentsRepository.activate(experimentId, project.id);
    return { ok: true };
  }

  /**
   * Weighted random variant for a running experiment, or null if none.
   */
  async pickVariant(projectId: string): Promise<{
    experimentId: string;
    variantId: string;
    promptContent: string;
    promptVersionId: string;
  } | null> {
    const running = await experimentsRepository.getRunningWithVariants(projectId);
    if (!running || running.variants.length === 0) {
      return null;
    }
    const total = running.variants.reduce((sum, v) => sum + v.variant.trafficPct, 0);
    let roll = Math.random() * Math.max(total, 1);
    for (const row of running.variants) {
      roll -= row.variant.trafficPct;
      if (roll <= 0) {
        return {
          experimentId: running.experiment.id,
          variantId: row.variant.id,
          promptContent: row.version.content,
          promptVersionId: row.version.id,
        };
      }
    }
    const fallback = running.variants[0]!;
    return {
      experimentId: running.experiment.id,
      variantId: fallback.variant.id,
      promptContent: fallback.version.content,
      promptVersionId: fallback.version.id,
    };
  }
}

export const experimentsService = new ExperimentsService();
