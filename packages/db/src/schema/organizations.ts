import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

export const orgPlanEnum = pgEnum('org_plan', ['free', 'pro', 'enterprise']);
export const orgMemberRoleEnum = pgEnum('org_member_role', ['owner', 'admin', 'member']);

export const organizations = pgTable('organizations', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  plan: orgPlanEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orgMembers = pgTable(
  'org_members',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: orgMemberRoleEnum('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.orgId, table.userId] })],
);
