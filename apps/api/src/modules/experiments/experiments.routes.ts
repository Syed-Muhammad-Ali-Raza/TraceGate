import { API_PREFIX } from '@llm-gateway/shared';
import type { RequestHandler } from 'express';
import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { csrfProtect } from '../../middlewares/csrf.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import {
  addVariantSchema,
  createExperimentSchema,
  experimentsService,
} from './experiments.service.js';

const listHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, { experiments: await experimentsService.list(req.user.id) });
});

const createHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = createExperimentSchema.parse(req.body);
  sendSuccess(res, { experiment: await experimentsService.create(req.user.id, body) }, { status: 201 });
});

const addVariantHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = addVariantSchema.parse(req.body);
  sendSuccess(
    res,
    {
      variant: await experimentsService.addVariant(req.user.id, String(req.params.id), body),
    },
    { status: 201 },
  );
});

const activateHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, await experimentsService.activate(req.user.id, String(req.params.id)));
});

export const experimentsRoutes = Router();
const base = `${API_PREFIX}/experiments`;
experimentsRoutes.get(base, authenticate, listHandler);
experimentsRoutes.post(base, authenticate, csrfProtect, createHandler);
experimentsRoutes.post(`${base}/:id/variants`, authenticate, csrfProtect, addVariantHandler);
experimentsRoutes.post(`${base}/:id/activate`, authenticate, csrfProtect, activateHandler);
