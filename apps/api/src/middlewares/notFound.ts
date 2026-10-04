import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

/**
 * Catch-all for unmatched routes so clients always get the standard error shape.
 */
export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError('Route not found', {
      statusCode: 404,
      code: 'NOT_FOUND',
    }),
  );
}
