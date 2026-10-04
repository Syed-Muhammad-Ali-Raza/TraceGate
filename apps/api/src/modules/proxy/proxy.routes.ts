import { Router } from 'express';

import { authenticateApiKey } from '../../middlewares/authenticateApiKey.js';
import { chatCompletionsHandler } from './proxy.controller.js';

export const proxyRoutes = Router();

proxyRoutes.post('/v1/chat/completions', authenticateApiKey, chatCompletionsHandler);
proxyRoutes.post('/api/v1/proxy/chat/completions', authenticateApiKey, chatCompletionsHandler);
