import { Queue } from 'bullmq';

import { env } from '../config/env.js';

export type LogIngestionJob = {
  projectId: string;
  apiKeyId: string;
  traceId?: string;
  sessionId?: string;
  userRef?: string;
  provider: string;
  model: string;
  statusCode: number;
  errorType?: string;
  isStream: boolean;
  cacheHit: boolean;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  ttftMs?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const connection = { url: env.REDIS_URL };

export const logIngestionQueue = new Queue<LogIngestionJob>('log-ingestion', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

/**
 * Fire-and-forget enqueue so logging never blocks the user response.
 */
export function enqueueLog(job: LogIngestionJob): void {
  void logIngestionQueue.add('log', job).catch(() => undefined);
}
