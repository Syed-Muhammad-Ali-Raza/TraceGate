import { SignJWT, jwtVerify } from 'jose';

import { env } from '../config/env.js';

const encoder = new TextEncoder();

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

/**
 * Issues a short-lived access JWT for dashboard cookie auth.
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(encoder.encode(env.JWT_ACCESS_SECRET));
}

/**
 * Verifies access JWT; throws on invalid/expired tokens.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, encoder.encode(env.JWT_ACCESS_SECRET));
  const sub = payload.sub;
  const email = payload.email;
  const role = payload.role;
  if (typeof sub !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
    throw new Error('Invalid access token payload');
  }
  return { sub, email, role };
}
