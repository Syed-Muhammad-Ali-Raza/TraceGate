import { API_PREFIX } from '@llm-gateway/shared';
import type { RequestHandler } from 'express';
import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { requestsService } from './requests.service.js';

export const listRequestsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const data = await requestsService.list(req.user!.id, cursor);
  sendSuccess(res, data);
});

export const getRequestHandler: RequestHandler = asyncHandler(async (req, res) => {
  const data = await requestsService.get(req.user!.id, String(req.params.id));
  sendSuccess(res, { request: data });
});

export const analyticsHandler: RequestHandler = asyncHandler(async (req, res) => {
  sendSuccess(res, await requestsService.analytics(req.user!.id));
});

export const requestsRoutes = Router();
requestsRoutes.get(`${API_PREFIX}/requests`, authenticate, listRequestsHandler);
requestsRoutes.get(`${API_PREFIX}/requests/:id`, authenticate, getRequestHandler);
requestsRoutes.get(`${API_PREFIX}/analytics`, authenticate, analyticsHandler);
