import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { AppError } from '../utils/AppError.js';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Zod validation middleware. Rejects unknown fields when schemas use `.strict()`.
 */
export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      next(
        new AppError('Invalid request', {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        }),
      );
      return;
    }
    (req as Request & Record<RequestPart, unknown>)[part] = parsed.data;
    next();
  };
}
