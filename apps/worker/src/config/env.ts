import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:16379'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid worker environment: ${JSON.stringify(parsed.error.flatten())}`);
  }
  return parsed.data;
}

export const env = loadEnv();
