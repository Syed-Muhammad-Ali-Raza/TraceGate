import { Queue } from 'bullmq';

import { env } from '../config/env.js';

export type EvalJob = {
  evalId: string;
  projectId: string;
  requestId: string;
  judgeModel: string;
  criteria: string;
  prompt: string;
  response: string;
};

export const evalQueue = new Queue<EvalJob>('eval-runner', {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export function enqueueEval(job: EvalJob): void {
  void evalQueue.add('judge', job).catch(() => undefined);
}
