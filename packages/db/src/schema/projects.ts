import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organizations';

export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  cacheTtl: integer('cache_ttl').notNull().default(0),
  retentionDays: integer('retention_days').notNull().default(90),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
