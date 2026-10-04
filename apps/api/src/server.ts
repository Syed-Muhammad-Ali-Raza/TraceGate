import './config/load-env.js';

import type { Server } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();

let server: Server | undefined;

/**
 * Stops accepting new connections and closes the HTTP server on SIGTERM/SIGINT.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down API');
  if (!server) {
    process.exit(0);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  logger.info('API stopped');
  process.exit(0);
}

server = app.listen(env.API_PORT, env.API_HOST, () => {
  logger.info({ host: env.API_HOST, port: env.API_PORT }, 'API listening');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});
