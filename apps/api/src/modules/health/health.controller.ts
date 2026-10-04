import type { RequestHandler } from 'express';

import { HEALTH_PATH } from '@llm-gateway/shared';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';

export type HealthStatus = {
  status: 'ok';
  service: 'api';
  timestamp: string;
  uptimeSeconds: number;
};

/**
 * Liveness probe used by Docker healthchecks and load balancers.
 */
export const healthHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const payload: HealthStatus = {
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
  sendSuccess(res, payload);
});

export const healthPath = HEALTH_PATH;
