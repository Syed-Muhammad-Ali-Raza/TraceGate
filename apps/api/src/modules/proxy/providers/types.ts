export type ChatMessage = { role: string; content?: unknown };

export type ProxyChatRequest = {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
};

export type ProviderResult = {
  statusCode: number;
  headers: Record<string, string>;
  body?: unknown;
  stream?: ReadableStream<Uint8Array> | NodeJS.ReadableStream;
};

export interface ProviderAdapter {
  readonly name: 'openai' | 'anthropic';
  forward(
    req: ProxyChatRequest,
    apiKey: string,
    options: { stream: boolean; signal?: AbortSignal },
  ): Promise<ProviderResult>;
}
