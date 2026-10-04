import { z } from 'zod';

import { enqueueEval } from '../../queues/eval.queue.js';
import { AppError } from '../../utils/AppError.js';
import { evalsRepository } from './evals.repository.js';

export const createEvalSchema = z
  .object({
    name: z.string().min(1).max(120),
    judgeModel: z.string().min(1).max(120),
    criteria: z.string().min(1).max(4000),
    sampleRate: z.number().int().min(1).max(100).default(10),
  })
  .strict();

export const runEvalSchema = z
  .object({
    requestId: z.string().uuid(),
    prompt: z.string().min(1),
    response: z.string().min(1),
  })
  .strict();

export class EvalsService {
  async list(userId: string) {
    const project = await evalsRepository.projectForUser(userId);
    if (!project) {
      return [];
    }
    return evalsRepository.list(project.id);
  }

  async create(userId: string, input: z.infer<typeof createEvalSchema>) {
    const project = await evalsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return evalsRepository.create({ projectId: project.id, ...input });
  }

  async results(userId: string, evalId: string) {
    const project = await evalsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    const row = await evalsRepository.get(evalId, project.id);
    if (!row) {
      throw new AppError('Eval not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return evalsRepository.listResults(evalId);
  }

  /**
   * Enqueues an on-demand LLM-as-judge job (never blocks the HTTP response).
   */
  async run(userId: string, evalId: string, input: z.infer<typeof runEvalSchema>) {
    const project = await evalsRepository.projectForUser(userId);
    if (!project) {
      throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
    }
    const row = await evalsRepository.get(evalId, project.id);
    if (!row) {
      throw new AppError('Eval not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    enqueueEval({
      evalId: row.id,
      projectId: project.id,
      requestId: input.requestId,
      judgeModel: row.judgeModel,
      criteria: row.criteria,
      prompt: input.prompt,
      response: input.response,
    });
    return { queued: true };
  }
}

export const evalsService = new EvalsService();
