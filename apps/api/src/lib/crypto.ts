import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { env } from '../config/env.js';

/**
 * SHA-256 hex digest used for refresh tokens and API keys at rest.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `lgw_live_${randomBytes(32).toString('hex')}`;
  return { raw, prefix: raw.slice(0, 16), hash: sha256(raw) };
}

function encryptionKey(): Buffer {
  return Buffer.from(env.PROVIDER_KEY_ENCRYPTION_KEY, 'hex');
}

/**
 * AES-256-GCM encrypt provider keys at rest.
 */
export function encryptSecret(plaintext: string): { encryptedKey: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    encryptedKey: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptSecret(input: {
  encryptedKey: string;
  iv: string;
  tag: string;
}): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(input.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(input.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(input.encryptedKey, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
