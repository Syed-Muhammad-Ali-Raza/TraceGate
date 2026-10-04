import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { projects } from './projects';
import { users } from './users';

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  promptId: uuid('prompt_id')
    .notNull()
    .references(() => prompts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').$type<Record<string, unknown>>().default({}),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const experimentVariants = pgTable('experiment_variants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  promptVersionId: uuid('prompt_version_id')
    .notNull()
    .references(() => promptVersions.id),
  trafficPct: integer('traffic_pct').notNull().default(50),
});

export const evals = pgTable('evals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  judgeModel: text('judge_model').notNull(),
  criteria: text('criteria').notNull(),
  sampleRate: integer('sample_rate').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const evalResults = pgTable('eval_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  evalId: uuid('eval_id')
    .notNull()
    .references(() => evals.id, { onDelete: 'cascade' }),
  requestId: uuid('request_id').notNull(),
  score: integer('score').notNull(),
  reasoning: text('reasoning'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
