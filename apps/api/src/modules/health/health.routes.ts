import { Router, type IRouter } from 'express';

import { healthHandler, healthPath } from './health.controller.js';

export const healthRoutes: IRouter = Router();

healthRoutes.get(healthPath, healthHandler);
