import cors from 'cors';
import express, { type Application, type Request } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { requestId } from './middlewares/requestId.js';
import { apiKeyRoutes } from './modules/api-keys/api-keys.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { evalsRoutes } from './modules/evals/evals.routes.js';
import { experimentsRoutes } from './modules/experiments/experiments.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { promptsRoutes } from './modules/prompts/prompts.routes.js';
import { proxyRoutes } from './modules/proxy/proxy.routes.js';
import { requestsRoutes } from './modules/requests/requests.routes.js';

/**
 * Builds the Express application without listening so tests can inject it.
 */
export function createApp(): Application {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.BODY_SIZE_LIMIT }));
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req: Request) => ({ requestId: req.requestId }),
    }),
  );

  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(apiKeyRoutes);
  app.use(requestsRoutes);
  app.use(promptsRoutes);
  app.use(experimentsRoutes);
  app.use(evalsRoutes);
  app.use(proxyRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
