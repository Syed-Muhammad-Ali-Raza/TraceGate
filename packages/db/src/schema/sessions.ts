import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

/**
 * Refresh-token sessions. Store only SHA-256(token); rotate on every refresh.
 * Reuse of a revoked token revokes the whole family_id.
 */
export const sessions = pgTable('sessions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull().unique(),
  familyId: uuid('family_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
