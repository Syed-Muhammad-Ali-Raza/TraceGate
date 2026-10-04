import { and, eq, isNull } from 'drizzle-orm';
import { orgMembers, organizations, projects, sessions, users } from '@llm-gateway/db';

import { db } from '../../lib/db.js';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  orgName: string;
};

/**
 * Persistence for auth: users, sessions, and bootstrap org/project.
 */
export class AuthRepository {
  /**
   * Finds a user by normalized email.
   */
  async findUserByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  /**
   * Finds a user by id.
   */
  async findUserById(id: string) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  /**
   * Creates user + personal org + membership + default project in one transaction.
   */
  async createUserWithOrg(input: CreateUserInput) {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          role: 'user',
        })
        .returning();

      if (!user) {
        throw new Error('Failed to create user');
      }

      const [org] = await tx
        .insert(organizations)
        .values({ name: input.orgName })
        .returning();

      if (!org) {
        throw new Error('Failed to create organization');
      }

      await tx.insert(orgMembers).values({
        orgId: org.id,
        userId: user.id,
        role: 'owner',
      });

      const [project] = await tx
        .insert(projects)
        .values({ orgId: org.id, name: 'Default Project' })
        .returning();

      if (!project) {
        throw new Error('Failed to create project');
      }

      return { user, org, project };
    });
  }

  /**
   * Inserts a refresh-token session row (hashed token only).
   */
  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    familyId: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }) {
    const [session] = await db.insert(sessions).values(input).returning();
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  }

  /**
   * Looks up an active (non-revoked) session by token hash.
   */
  async findActiveSessionByHash(refreshTokenHash: string) {
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Finds any session by hash including revoked (for reuse detection).
   */
  async findSessionByHash(refreshTokenHash: string) {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Revokes a single session.
   */
  async revokeSession(id: string) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
  }

  /**
   * Revokes every session in a token family (reuse attack response).
   */
  async revokeSessionFamily(familyId: string) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt)));
  }
}

export const authRepository = new AuthRepository();
