import type { Response } from 'express';

type SuccessMeta = Record<string, unknown>;

/**
 * Standard success envelope used by every dashboard API route.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { status?: number; meta?: SuccessMeta } = {},
): void {
  res.status(options.status ?? 200).json({
    success: true,
    data,
    error: null,
    meta: options.meta ?? null,
  });
}
