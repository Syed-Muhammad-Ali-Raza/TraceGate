import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { projects } from './projects';

/**
 * Gateway API keys. Persist only SHA-256(key) + visible prefix.
 * Full key is shown once at creation time.
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  scopes: jsonb('scopes').$type<string[]>().notNull().default(['proxy:invoke']),
  rateLimit: integer('rate_limit').notNull().default(60),
  budgetUsd: numeric('budget_usd', { precision: 12, scale: 2 }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
