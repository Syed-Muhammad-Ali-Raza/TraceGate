import { API_PREFIX } from '@llm-gateway/shared';
import type { RequestHandler } from 'express';
import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { csrfProtect } from '../../middlewares/csrf.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import { createEvalSchema, evalsService, runEvalSchema } from './evals.service.js';

const listHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, { evals: await evalsService.list(req.user.id) });
});

const createHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = createEvalSchema.parse(req.body);
  sendSuccess(res, { eval: await evalsService.create(req.user.id, body) }, { status: 201 });
});

const resultsHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, {
    results: await evalsService.results(req.user.id, String(req.params.id)),
  });
});

const runHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = runEvalSchema.parse(req.body);
  sendSuccess(res, await evalsService.run(req.user.id, String(req.params.id), body));
});

export const evalsRoutes = Router();
const base = `${API_PREFIX}/evals`;
evalsRoutes.get(base, authenticate, listHandler);
evalsRoutes.post(base, authenticate, csrfProtect, createHandler);
evalsRoutes.get(`${base}/:id/results`, authenticate, resultsHandler);
evalsRoutes.post(`${base}/:id/run`, authenticate, csrfProtect, runHandler);
