import { Readable } from 'node:stream';

import type { ProviderAdapter, ProviderResult, ProxyChatRequest } from './types.js';

/**
 * Local OpenAI-shaped responses so the gateway can be exercised without a real provider key.
 * Enabled with MOCK_LLM=true (development only).
 */
export class MockProvider implements ProviderAdapter {
  readonly name = 'openai' as const;

  async forward(
    req: ProxyChatRequest,
    _apiKey: string,
    options: { stream: boolean; signal?: AbortSignal },
  ): Promise<ProviderResult> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const prompt = String(lastUser?.content ?? '').slice(0, 200);
    const content = `Mock reply (no provider key): ${prompt || 'ok'}`;
    const id = `chatcmpl-mock-${Date.now()}`;

    if (options.stream) {
      const chunks = [
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }],
        })}\n\n`,
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          choices: [{ index: 0, delta: { content }, finish_reason: null }],
        })}\n\n`,
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        })}\n\n`,
        'data: [DONE]\n\n',
      ];
      const stream = Readable.from(chunks.map((c) => Buffer.from(c, 'utf8')));
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        stream,
      };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {
        id,
        object: 'chat.completion',
        model: req.model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: Math.max(1, Math.ceil(prompt.length / 4)),
          completion_tokens: Math.max(1, Math.ceil(content.length / 4)),
          total_tokens: Math.max(2, Math.ceil((prompt.length + content.length) / 4)),
        },
      },
    };
  }
}

export const mockProvider = new MockProvider();
