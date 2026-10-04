import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

/**
 * Central error handler. Never leaks stack traces outside development.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.flatten(),
      },
      meta: { requestId: req.requestId ?? null },
    });
    return;
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'Internal server error';

  logger.error(
    {
      err,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    },
    message,
  );

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(env.NODE_ENV === 'development' && !isAppError
        ? { stack: err instanceof Error ? err.stack : undefined }
        : {}),
      ...(isAppError && err.details !== undefined ? { details: err.details } : {}),
    },
    meta: {
      requestId: req.requestId ?? null,
    },
  });
}
