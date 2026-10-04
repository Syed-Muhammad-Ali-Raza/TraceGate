import { randomBytes, randomUUID } from 'node:crypto';

import { hash, verify } from 'argon2';
import type { LoginInput, RegisterInput } from '@llm-gateway/shared';

import { env } from '../../config/env.js';
import { generateRefreshToken, sha256 } from '../../lib/crypto.js';
import { signAccessToken } from '../../lib/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository, type AuthRepository } from './auth.repository.js';

export type AuthUserView = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: AuthUserView;
};

/**
 * Auth business logic: register/login/refresh/logout with rotation + reuse detection.
 */
export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  /**
   * Registers a user and returns cookie tokens. Throws Conflict if email exists.
   */
  async register(input: RegisterInput, meta: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.repo.findUserByEmail(email);
    if (existing) {
      throw new AppError('Email already registered', {
        statusCode: 409,
        code: 'EMAIL_TAKEN',
      });
    }

    const passwordHash = await hash(input.password, { type: 2 });
    const orgName = input.name?.trim() || `${email.split('@')[0]}'s Org`;
    const { user } = await this.repo.createUserWithOrg({
      email,
      passwordHash,
      orgName,
    });

    return this.issueSession(user, meta);
  }

  /**
   * Validates credentials and issues a new session family.
   */
  async login(input: LoginInput, meta: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const ok = await verify(user.passwordHash, input.password);
    if (!ok) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    return this.issueSession(user, meta);
  }

  /**
   * Rotates refresh token. Reuse of an old token revokes the whole family.
   */
  async refresh(
    refreshToken: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new AppError('Refresh token missing', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const tokenHash = sha256(refreshToken);
    const session = await this.repo.findSessionByHash(tokenHash);

    if (!session) {
      throw new AppError('Invalid refresh token', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    if (session.revokedAt) {
      await this.repo.revokeSessionFamily(session.familyId);
      throw new AppError('Refresh token reuse detected', {
        statusCode: 401,
        code: 'TOKEN_REUSE',
      });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.repo.revokeSession(session.id);
      throw new AppError('Refresh token expired', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    await this.repo.revokeSession(session.id);

    const user = await this.repo.findUserById(session.userId);
    if (!user) {
      throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    return this.issueSession(user, meta, session.familyId);
  }

  /**
   * Revokes the current refresh session if present.
   */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const session = await this.repo.findActiveSessionByHash(sha256(refreshToken));
    if (session) {
      await this.repo.revokeSession(session.id);
    }
  }

  /**
   * Returns the public user view for /me.
   */
  async me(userId: string): Promise<AuthUserView> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async issueSession(
    user: { id: string; email: string; role: string; createdAt: Date },
    meta: { ip?: string; userAgent?: string },
    familyId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      familyId,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      csrfToken: randomBytes(32).toString('base64url'),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}

export const authService = new AuthService();
