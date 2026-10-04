import { env } from '../../../config/env.js';
import type { ProviderAdapter, ProviderResult, ProxyChatRequest } from './types.js';

/**
 * Anthropic Messages API adapter with OpenAI-compatible request shape input.
 */
export class AnthropicProvider implements ProviderAdapter {
  readonly name = 'anthropic' as const;

  async forward(
    req: ProxyChatRequest,
    apiKey: string,
    options: { stream: boolean; signal?: AbortSignal },
  ): Promise<ProviderResult> {
    const system = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => String(m.content))
      .join('\n');
    const messages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const res = await fetch(`${env.ANTHROPIC_API_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.max_tokens ?? 1024,
        temperature: req.temperature,
        system: system || undefined,
        messages,
        stream: options.stream,
      }),
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

export const anthropicProvider = new AnthropicProvider();
