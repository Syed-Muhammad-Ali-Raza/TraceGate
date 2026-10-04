import type { RequestHandler } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import {
  apiKeyService,
  createApiKeySchema,
  upsertProviderKeySchema,
} from './api-keys.service.js';

export const listKeysHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, { keys: await apiKeyService.list(req.user.id) });
});

export const createKeyHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = createApiKeySchema.parse(req.body);
  const result = await apiKeyService.create(req.user.id, body);
  sendSuccess(res, result, { status: 201 });
});

export const revokeKeyHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const id = zUuid(String(req.params.id));
  await apiKeyService.revoke(req.user.id, id);
  sendSuccess(res, { ok: true });
});

export const listProviderKeysHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  sendSuccess(res, { keys: await apiKeyService.listProviderKeys(req.user.id) });
});

export const upsertProviderKeyHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  const body = upsertProviderKeySchema.parse(req.body);
  sendSuccess(res, await apiKeyService.upsertProviderKey(req.user.id, body));
});

function zUuid(value: string | undefined): string {
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'VALIDATION_ERROR' });
  }
  return value;
}
