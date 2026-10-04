import { and, desc, eq } from 'drizzle-orm';
import { API_PREFIX } from '@llm-gateway/shared';
import { promptVersions, prompts } from '@llm-gateway/db';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../lib/db.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { csrfProtect } from '../../middlewares/csrf.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import { apiKeyRepository } from '../api-keys/api-keys.repository.js';

const createPromptSchema = z
  .object({
    name: z.string().min(1).max(120),
    slug: z.string().min(1).max(120),
    content: z.string().min(1),
  })
  .strict();

export const listPromptsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const project = await apiKeyRepository.firstProjectForUser(req.user!.id);
  if (!project) {
    sendSuccess(res, { prompts: [] });
    return;
  }
  const rows = await db.select().from(prompts).where(eq(prompts.projectId, project.id));
  sendSuccess(res, { prompts: rows });
});

export const createPromptHandler: RequestHandler = asyncHandler(async (req, res) => {
  const body = createPromptSchema.parse(req.body);
  const project = await apiKeyRepository.firstProjectForUser(req.user!.id);
  if (!project) {
    throw new AppError('No project', { statusCode: 404, code: 'NOT_FOUND' });
  }
  const [prompt] = await db
    .insert(prompts)
    .values({ projectId: project.id, name: body.name, slug: body.slug })
    .returning();
  const [version] = await db
    .insert(promptVersions)
    .values({
      promptId: prompt!.id,
      version: 1,
      content: body.content,
      createdBy: req.user!.id,
    })
    .returning();
  sendSuccess(res, { prompt, version }, { status: 201 });
});

export const listVersionsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const rows = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, String(req.params.id)))
    .orderBy(desc(promptVersions.version));
  sendSuccess(res, { versions: rows });
});

export const promptsRoutes = Router();
promptsRoutes.get(`${API_PREFIX}/prompts`, authenticate, listPromptsHandler);
promptsRoutes.post(`${API_PREFIX}/prompts`, authenticate, csrfProtect, createPromptHandler);
promptsRoutes.get(
  `${API_PREFIX}/prompts/:id/versions`,
  authenticate,
  listVersionsHandler,
);
