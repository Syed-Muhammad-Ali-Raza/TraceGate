import { describe, expect, it } from 'vitest';

import { estimateCostUsd, roughTokenCount } from './cost.service';

describe('cost.service', () => {
  it('estimates cost for known models', () => {
    const cost = estimateCostUsd('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75, 5);
  });

  it('roughly counts tokens', () => {
    expect(roughTokenCount('abcd')).toBe(1);
    expect(roughTokenCount('a'.repeat(40))).toBe(10);
  });
});
