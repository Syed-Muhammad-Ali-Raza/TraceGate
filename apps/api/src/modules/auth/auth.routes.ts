import { API_PREFIX } from '@llm-gateway/shared';
import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { csrfIssueHandler, csrfProtect } from '../../middlewares/csrf.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from './auth.controller.js';

export const authRoutes = Router();

const base = `${API_PREFIX}/auth`;

authRoutes.get(`${base}/csrf`, csrfIssueHandler);
authRoutes.post(`${base}/register`, authRateLimiter, csrfProtect, registerHandler);
authRoutes.post(`${base}/login`, authRateLimiter, csrfProtect, loginHandler);
authRoutes.post(`${base}/refresh`, authRateLimiter, refreshHandler);
authRoutes.post(`${base}/logout`, authenticate, csrfProtect, logoutHandler);
authRoutes.get(`${base}/me`, authenticate, meHandler);
