import { loginSchema, registerSchema } from '@llm-gateway/shared';
import type { RequestHandler } from 'express';

import {
  clearAuthCookies,
  parseCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../../lib/cookies.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { authService } from './auth.service.js';

export const registerHandler: RequestHandler = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const tokens = await authService.register(body, {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  });
  setAuthCookies(res, tokens);
  sendSuccess(res, { user: tokens.user }, { status: 201 });
});

export const loginHandler: RequestHandler = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const tokens = await authService.login(body, {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  });
  setAuthCookies(res, tokens);
  sendSuccess(res, { user: tokens.user });
});

export const refreshHandler: RequestHandler = asyncHandler(async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const tokens = await authService.refresh(cookies[REFRESH_COOKIE], {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  });
  setAuthCookies(res, tokens);
  sendSuccess(res, { user: tokens.user });
});

export const logoutHandler: RequestHandler = asyncHandler(async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  await authService.logout(cookies[REFRESH_COOKIE]);
  clearAuthCookies(res);
  sendSuccess(res, { ok: true });
});

export const meHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    sendSuccess(res, { user: null });
    return;
  }
  const user = await authService.me(req.user.id);
  sendSuccess(res, { user });
});
