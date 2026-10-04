import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

/**
 * Attaches a request id for log correlation across proxy and dashboard traffic.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length > 0 ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
