import pino from 'pino';

import { env } from './env.js';

/**
 * Shared Pino logger. Secrets are redacted so they never appear in stdout.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'refreshToken',
      'apiKey',
      'providerKey',
    ],
    censor: '[Redacted]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined,
});
