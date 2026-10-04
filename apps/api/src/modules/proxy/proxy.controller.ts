import type { RequestHandler } from 'express';
import { Readable } from 'node:stream';

import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import type { ProxyChatRequest } from './providers/types.js';
import { chatCompletionSchema, proxyService } from './proxy.service.js';
import { roughTokenCount } from './cost.service.js';

export const chatCompletionsHandler: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.apiKey) {
    throw new AppError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
  }

  const body = chatCompletionSchema.parse(req.body) as ProxyChatRequest;
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const headers = {
    traceId: req.get('x-trace-id') ?? undefined,
    sessionId: req.get('x-session-id') ?? undefined,
    userRef: req.get('x-user-id') ?? undefined,
    metadata: parseMetadata(req.get('x-custom-metadata')),
  };

  const result = await proxyService.chatCompletions({
    body,
    apiKey: req.apiKey,
    headers,
    signal: controller.signal,
  });

  if (!body.stream) {
    res.status(result.statusCode).json(result.body);
    return;
  }

  res.status(result.statusCode);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const started = result.started ?? Date.now();
  let firstTokenAt: number | undefined;
  let completionText = '';

  const upstream = result.stream;
  if (!upstream) {
    res.end();
    return;
  }

  const nodeStream =
    upstream instanceof Readable
      ? upstream
      : Readable.fromWeb(upstream as unknown as import('stream/web').ReadableStream);

  nodeStream.on('data', (chunk: Buffer | string) => {
    if (firstTokenAt === undefined) {
      firstTokenAt = Date.now();
    }
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    completionText += text;
    res.write(chunk);
  });

  nodeStream.on('end', () => {
    proxyService.log({
      apiKey: req.apiKey!,
      provider: result.provider ?? 'openai',
      model: result.model ?? body.model,
      statusCode: result.statusCode,
      isStream: true,
      cacheHit: false,
      promptTokens: roughTokenCount(
        body.messages.map((m) => String(m.content ?? '')).join('\n'),
      ),
      completionTokens: roughTokenCount(completionText),
      latencyMs: Date.now() - started,
      ttftMs: firstTokenAt ? firstTokenAt - started : undefined,
      requestBody: body,
      responseBody: { streamed: true, preview: completionText.slice(0, 4000) },
      headers,
    });
    res.end();
  });

  nodeStream.on('error', () => {
    proxyService.log({
      apiKey: req.apiKey!,
      provider: result.provider ?? 'openai',
      model: result.model ?? body.model,
      statusCode: 499,
      isStream: true,
      cacheHit: false,
      promptTokens: 0,
      completionTokens: roughTokenCount(completionText),
      latencyMs: Date.now() - started,
      ttftMs: firstTokenAt ? firstTokenAt - started : undefined,
      requestBody: body,
      responseBody: { streamed: true, partial: true },
      headers,
      errorType: 'client_disconnect_or_upstream',
    });
    res.end();
  });
});

function parseMetadata(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}
