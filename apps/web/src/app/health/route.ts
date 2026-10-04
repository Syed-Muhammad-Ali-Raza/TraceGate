import { NextResponse } from 'next/server';

/**
 * Liveness endpoint for Docker and reverse proxies.
 */
export function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      service: 'web',
      timestamp: new Date().toISOString(),
    },
    error: null,
    meta: null,
  });
}
