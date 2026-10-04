import type { CorsOptions } from 'cors';

import { env } from './env.js';

/**
 * Allowlist-only CORS. Credentials require an explicit origin (never *).
 */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
