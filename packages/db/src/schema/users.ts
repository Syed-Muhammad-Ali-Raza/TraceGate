import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

/**
 * Dashboard users. Passwords are argon2id hashes — never store plaintext.
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
