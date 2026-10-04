import { z } from 'zod';

/**
 * Fail-fast env validation so misconfiguration never reaches request handlers.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  BODY_SIZE_LIMIT: z.string().default('1mb'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:16379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(14),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CSRF_SECRET: z.string().min(32),
  PROVIDER_KEY_ENCRYPTION_KEY: z.string().length(64),
  OPENAI_API_BASE: z.string().default('https://api.openai.com/v1'),
  ANTHROPIC_API_BASE: z.string().default('https://api.anthropic.com'),
  /** When true, proxy returns local mock completions (no OpenAI/Anthropic key needed). */
  MOCK_LLM: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  AUTH_RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_DURATION_SECONDS: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(details)}`);
  }
  return parsed.data;
}

export const env = loadEnv();
