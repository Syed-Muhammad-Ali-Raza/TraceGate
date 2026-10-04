import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { projects } from './projects';
import { apiKeys } from './api-keys';
import { promptVersions } from './prompts';

export const providerKeys = pgTable('provider_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const modelPrices = pgTable('model_prices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputPer1m: numeric('input_per_1m', { precision: 12, scale: 6 }).notNull(),
  outputPer1m: numeric('output_per_1m', { precision: 12, scale: 6 }).notNull(),
  cachedInputPer1m: numeric('cached_input_per_1m', { precision: 12, scale: 6 }),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * High-volume request log. Partitioning SQL added in a custom migration.
 */
export const llmRequests = pgTable('llm_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id),
  traceId: text('trace_id'),
  sessionId: text('session_id'),
  userRef: text('user_ref'),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  statusCode: integer('status_code').notNull(),
  errorType: text('error_type'),
  isStream: boolean('is_stream').notNull().default(false),
  cacheHit: boolean('cache_hit').notNull().default(false),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  latencyMs: integer('latency_ms'),
  ttftMs: integer('ttft_ms'),
  promptVersionId: uuid('prompt_version_id').references(() => promptVersions.id),
  experimentVariant: text('experiment_variant'),
  requestBody: jsonb('request_body'),
  responseBody: jsonb('response_body'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usageHourly = pgTable('usage_hourly', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  hour: timestamp('hour', { withTimezone: true }).notNull(),
  requests: integer('requests').notNull().default(0),
  tokens: integer('tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 14, scale: 6 }).notNull().default('0'),
  errors: integer('errors').notNull().default(0),
  p50: integer('p50'),
  p95: integer('p95'),
});

export const usageDaily = pgTable('usage_daily', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  day: timestamp('day', { withTimezone: true }).notNull(),
  requests: integer('requests').notNull().default(0),
  tokens: integer('tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 14, scale: 6 }).notNull().default('0'),
  errors: integer('errors').notNull().default(0),
  p50: integer('p50'),
  p95: integer('p95'),
});
