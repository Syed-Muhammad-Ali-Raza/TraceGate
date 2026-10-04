const DEFAULT_PRICES: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4 },
};

/**
 * Converts token usage to USD using a static price table (DB prices land later).
 */
export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const price = DEFAULT_PRICES[model] ?? { input: 1, output: 3 };
  return (promptTokens / 1_000_000) * price.input + (completionTokens / 1_000_000) * price.output;
}

export function roughTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
