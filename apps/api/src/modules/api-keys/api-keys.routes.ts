import { API_PREFIX } from '@llm-gateway/shared';
import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { csrfProtect } from '../../middlewares/csrf.js';
import {
  createKeyHandler,
  listKeysHandler,
  listProviderKeysHandler,
  revokeKeyHandler,
  upsertProviderKeyHandler,
} from './api-keys.controller.js';

export const apiKeyRoutes = Router();
const base = `${API_PREFIX}/api-keys`;
const providers = `${API_PREFIX}/provider-keys`;

apiKeyRoutes.get(base, authenticate, listKeysHandler);
apiKeyRoutes.post(base, authenticate, csrfProtect, createKeyHandler);
apiKeyRoutes.post(`${base}/:id/revoke`, authenticate, csrfProtect, revokeKeyHandler);
apiKeyRoutes.get(providers, authenticate, listProviderKeysHandler);
apiKeyRoutes.post(providers, authenticate, csrfProtect, upsertProviderKeyHandler);
