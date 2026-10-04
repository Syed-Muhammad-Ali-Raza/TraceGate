/**
 * Application error with HTTP status and stable machine-readable code.
 * Services throw these; the central error handler maps them to responses.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      isOperational?: boolean;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
  }
}
