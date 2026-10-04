import './config/load-env.js';

import { createDb, evalResults, llmRequests, usageHourly } from '@llm-gateway/db';
import { Worker } from 'bullmq';

import { env } from './config/env.js';
import { logger } from './config/logger.js';

const { db, client } = createDb(env.DATABASE_URL);

type LogJob = {
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

type EvalJob = {
  evalId: string;
  projectId: string;
  requestId: string;
  judgeModel: string;
  criteria: string;
  prompt: string;
  response: string;
};

const batch: LogJob[] = [];
let flushTimer: NodeJS.Timeout | undefined;

async function flush(): Promise<void> {
  if (batch.length === 0) {
    return;
  }
  const rows = batch.splice(0, batch.length);
  await db.insert(llmRequests).values(
    rows.map((r) => ({
      projectId: r.projectId,
      apiKeyId: r.apiKeyId,
      traceId: r.traceId,
      sessionId: r.sessionId,
      userRef: r.userRef,
      provider: r.provider,
      model: r.model,
      statusCode: r.statusCode,
      errorType: r.errorType,
      isStream: r.isStream,
      cacheHit: r.cacheHit,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      cachedTokens: r.cachedTokens,
      totalTokens: r.totalTokens,
      costUsd: String(r.costUsd),
      latencyMs: r.latencyMs,
      ttftMs: r.ttftMs,
      experimentVariant:
        typeof r.metadata?.experimentVariant === 'string'
          ? r.metadata.experimentVariant
          : undefined,
      requestBody: r.requestBody,
      responseBody: r.responseBody,
      metadata: r.metadata ?? {},
      createdAt: new Date(r.createdAt),
    })),
  );

  for (const r of rows) {
    const hour = new Date(r.createdAt);
    hour.setMinutes(0, 0, 0);
    await db.insert(usageHourly).values({
      projectId: r.projectId,
      model: r.model,
      hour,
      requests: 1,
      tokens: r.totalTokens,
      costUsd: String(r.costUsd),
      errors: r.statusCode >= 400 ? 1 : 0,
      p50: r.latencyMs,
      p95: r.latencyMs,
    });
  }
}

function scheduleFlush(): void {
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    void flush().catch((err: unknown) => logger.error({ err }, 'flush failed'));
  }, Number(process.env.LOG_INGESTION_FLUSH_MS ?? 1000));
}

/**
 * Heuristic LLM-as-judge placeholder when no judge provider call is configured.
 * Scores 1–10 from criteria keyword overlap; real provider judge can replace this.
 */
function judgeLocally(criteria: string, prompt: string, response: string): {
  score: number;
  reasoning: string;
} {
  const needles = criteria
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const hay = `${prompt}\n${response}`.toLowerCase();
  const hits = needles.filter((n) => hay.includes(n)).length;
  const ratio = needles.length === 0 ? 0.5 : hits / needles.length;
  const score = Math.max(1, Math.min(10, Math.round(ratio * 10)));
  return {
    score,
    reasoning: `Matched ${hits}/${needles.length || 0} criteria tokens (local judge).`,
  };
}

const logWorker = new Worker<LogJob>(
  'log-ingestion',
  async (job) => {
    batch.push(job.data);
    if (batch.length >= Number(process.env.LOG_INGESTION_BATCH_SIZE ?? 500)) {
      await flush();
    } else {
      scheduleFlush();
    }
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: env.WORKER_CONCURRENCY,
  },
);

const evalWorker = new Worker<EvalJob>(
  'eval-runner',
  async (job) => {
    const judged = judgeLocally(job.data.criteria, job.data.prompt, job.data.response);
    await db.insert(evalResults).values({
      evalId: job.data.evalId,
      requestId: job.data.requestId,
      score: judged.score,
      reasoning: judged.reasoning,
    });
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: Math.max(1, Math.floor(env.WORKER_CONCURRENCY / 2)),
  },
);

logWorker.on('ready', () => logger.info('Log ingestion worker ready'));
evalWorker.on('ready', () => logger.info('Eval runner worker ready'));
logWorker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Log job failed'));
evalWorker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Eval job failed'));

process.on('SIGTERM', () => {
  void (async () => {
    await flush();
    await logWorker.close();
    await evalWorker.close();
    await client.end({ timeout: 5 });
    process.exit(0);
  })();
});

logger.info({ concurrency: env.WORKER_CONCURRENCY }, 'Worker started');
