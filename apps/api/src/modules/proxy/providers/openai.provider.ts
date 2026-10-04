import { env } from '../../../config/env.js';
import type { ProviderAdapter, ProviderResult, ProxyChatRequest } from './types.js';

export class OpenAIProvider implements ProviderAdapter {
  readonly name = 'openai' as const;

  async forward(
    req: ProxyChatRequest,
    apiKey: string,
    options: { stream: boolean; signal?: AbortSignal },
  ): Promise<ProviderResult> {
    const headersOut: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    // OpenRouter recommends these; harmless for other OpenAI-compatible hosts.
    if (env.OPENAI_API_BASE.includes('openrouter.ai')) {
      headersOut['HTTP-Referer'] = 'http://localhost:3000';
      headersOut['X-Title'] = 'LLM Gateway';
    }

    const res = await fetch(`${env.OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: headersOut,
      body: JSON.stringify({ ...req, stream: options.stream }),
      signal: options.signal,
    });

    const headers: Record<string, string> = {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    };

    if (options.stream && res.body) {
      return { statusCode: res.status, headers, stream: res.body as unknown as NodeJS.ReadableStream };
    }

    const body: unknown = await res.json();
    return { statusCode: res.status, headers, body };
  }
}

export const openAIProvider = new OpenAIProvider();
