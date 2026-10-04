import { z } from 'zod';

import { env } from '../../config/env.js';
import { decryptSecret } from '../../lib/crypto.js';
import { enqueueLog } from '../../queues/logIngestion.queue.js';
import { AppError } from '../../utils/AppError.js';
import { apiKeyRepository } from '../api-keys/api-keys.repository.js';
import { experimentsService } from '../experiments/experiments.service.js';
import { cacheKey, getCachedResponse, setCachedResponse } from './cache.service.js';
import { estimateCostUsd, roughTokenCount } from './cost.service.js';
import { anthropicProvider } from './providers/anthropic.provider.js';
import { mockProvider } from './providers/mock.provider.js';
import { openAIProvider } from './providers/openai.provider.js';
import type { ProviderAdapter, ProxyChatRequest } from './providers/types.js';

export const chatCompletionSchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(
      z.object({
        role: z.string(),
        content: z.unknown(),
      }),
    ),
    stream: z.boolean().optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().int().positive().optional(),
  })
  .passthrough();

function pickProvider(model: string): ProviderAdapter {
  if (env.MOCK_LLM) {
    return mockProvider;
  }
  if (model.startsWith('claude')) {
    return anthropicProvider;
  }
  return openAIProvider;
}

function fallbackProvider(primary: ProviderAdapter): ProviderAdapter {
  return primary.name === 'openai' ? anthropicProvider : openAIProvider;
}

function messagesText(messages: ProxyChatRequest['messages']): string {
  return messages.map((m) => String(m.content ?? '')).join('\n');
}

export class ProxyService {
  /**
   * Resolves provider credentials for the project (encrypted at rest).
   */
  async resolveProviderKey(projectId: string, provider: 'openai' | 'anthropic') {
    if (env.MOCK_LLM) {
      return 'mock';
    }
    const row = await apiKeyRepository.getProviderKey(projectId, provider);
    if (!row) {
      throw new AppError(`Provider key for ${provider} is not configured`, {
        statusCode: 400,
        code: 'PROVIDER_KEY_MISSING',
      });
    }
    return decryptSecret(row);
  }

  /**
   * Non-streaming + streaming chat completion with cache, A/B, fallback, and async logging.
   */
  async chatCompletions(input: {
    body: ProxyChatRequest;
    apiKey: NonNullable<Express.Request['apiKey']>;
    headers: {
      traceId?: string;
      sessionId?: string;
      userRef?: string;
      metadata?: Record<string, unknown>;
    };
    signal?: AbortSignal;
  }) {
    const started = Date.now();
    const stream = Boolean(input.body.stream);
    let body = { ...input.body, messages: [...input.body.messages] };

    const variant = await experimentsService.pickVariant(input.apiKey.projectId);
    if (variant) {
      body = {
        ...body,
        messages: [{ role: 'system', content: variant.promptContent }, ...body.messages],
      };
      input.headers.metadata = {
        ...(input.headers.metadata ?? {}),
        experimentId: variant.experimentId,
        experimentVariant: variant.variantId,
        promptVersionId: variant.promptVersionId,
      };
    }

    const provider = pickProvider(body.model);
    const deterministic = body.temperature === 0 || body.temperature === undefined;
    const key = cacheKey(body.model, {
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      experimentVariant: variant?.variantId,
    });

    if (!stream && deterministic && input.apiKey.cacheTtl > 0) {
      const cached = await getCachedResponse(key);
      if (cached) {
        this.log({
          apiKey: input.apiKey,
          provider: provider.name,
          model: body.model,
          statusCode: 200,
          isStream: false,
          cacheHit: true,
          promptTokens: 0,
          completionTokens: 0,
          latencyMs: Date.now() - started,
          requestBody: body,
          responseBody: cached,
          headers: input.headers,
        });
        return { statusCode: 200, body: cached, stream: undefined, ttftMs: undefined };
      }
    }

    const { result, usedProvider } = await this.forwardWithFallback({
      body,
      projectId: input.apiKey.projectId,
      primary: provider,
      stream,
      signal: input.signal,
    });

    if (!stream) {
      const usage = extractUsage(result.body);
      const promptTokens =
        usage.promptTokens || roughTokenCount(messagesText(body.messages));
      const completionTokens =
        usage.completionTokens || roughTokenCount(JSON.stringify(result.body ?? ''));
      if (result.statusCode < 400 && deterministic && input.apiKey.cacheTtl > 0) {
        await setCachedResponse(key, result.body, input.apiKey.cacheTtl);
      }
      this.log({
        apiKey: input.apiKey,
        provider: usedProvider,
        model: body.model,
        statusCode: result.statusCode,
        isStream: false,
        cacheHit: false,
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - started,
        requestBody: body,
        responseBody: result.body,
        headers: input.headers,
        errorType: result.statusCode >= 400 ? 'provider_error' : undefined,
      });
      return {
        statusCode: result.statusCode,
        body: result.body,
        stream: undefined,
        ttftMs: undefined,
      };
    }

    return {
      statusCode: result.statusCode,
      body: undefined,
      stream: result.stream,
      started,
      provider: usedProvider,
      model: body.model,
      requestBody: body,
      headers: input.headers,
      apiKey: input.apiKey,
    };
  }

  /**
   * Tries the primary provider; on 5xx/network failure falls back to the other if configured.
   */
  private async forwardWithFallback(input: {
    body: ProxyChatRequest;
    projectId: string;
    primary: ProviderAdapter;
    stream: boolean;
    signal?: AbortSignal;
  }) {
    if (env.MOCK_LLM) {
      const result = await mockProvider.forward(input.body, 'mock', {
        stream: input.stream,
        signal: input.signal,
      });
      return { result, usedProvider: 'mock' };
    }

    try {
      const providerKey = await this.resolveProviderKey(input.projectId, input.primary.name);
      const result = await input.primary.forward(input.body, providerKey, {
        stream: input.stream,
        signal: input.signal,
      });
      if (result.statusCode < 500) {
        return { result, usedProvider: input.primary.name };
      }
    } catch {
      // try fallback below
    }

    const secondary = fallbackProvider(input.primary);
    const secondaryKeyRow = await apiKeyRepository.getProviderKey(input.projectId, secondary.name);
    if (!secondaryKeyRow) {
      throw new AppError('Primary provider failed and no fallback key is configured', {
        statusCode: 502,
        code: 'PROVIDER_FALLBACK_FAILED',
      });
    }
    const secondaryKey = decryptSecret(secondaryKeyRow);
    const fallbackBody =
      secondary.name === 'anthropic' && !input.body.model.startsWith('claude')
        ? { ...input.body, model: 'claude-3-5-haiku-latest' }
        : secondary.name === 'openai' && input.body.model.startsWith('claude')
          ? { ...input.body, model: 'gpt-4o-mini' }
          : input.body;

    const result = await secondary.forward(fallbackBody, secondaryKey, {
      stream: input.stream,
      signal: input.signal,
    });
    return { result, usedProvider: secondary.name };
  }

  log(input: {
    apiKey: NonNullable<Express.Request['apiKey']>;
    provider: string;
    model: string;
    statusCode: number;
    isStream: boolean;
    cacheHit: boolean;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    ttftMs?: number;
    requestBody?: unknown;
    responseBody?: unknown;
    headers: {
      traceId?: string;
      sessionId?: string;
      userRef?: string;
      metadata?: Record<string, unknown>;
    };
    errorType?: string;
  }): void {
    const totalTokens = input.promptTokens + input.completionTokens;
    enqueueLog({
      projectId: input.apiKey.projectId,
      apiKeyId: input.apiKey.id,
      traceId: input.headers.traceId,
      sessionId: input.headers.sessionId,
      userRef: input.headers.userRef,
      provider: input.provider,
      model: input.model,
      statusCode: input.statusCode,
      errorType: input.errorType,
      isStream: input.isStream,
      cacheHit: input.cacheHit,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      cachedTokens: 0,
      totalTokens,
      costUsd: estimateCostUsd(input.model, input.promptTokens, input.completionTokens),
      latencyMs: input.latencyMs,
      ttftMs: input.ttftMs,
      requestBody: input.requestBody,
      responseBody: input.responseBody,
      metadata: input.headers.metadata,
      createdAt: new Date().toISOString(),
    });
  }
}

function extractUsage(body: unknown): { promptTokens: number; completionTokens: number } {
  if (!body || typeof body !== 'object') {
    return { promptTokens: 0, completionTokens: 0 };
  }
  const usage = (body as { usage?: Record<string, number> }).usage;
  return {
    promptTokens: usage?.prompt_tokens ?? usage?.input_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? usage?.output_tokens ?? 0,
  };
}

export const proxyService = new ProxyService();
