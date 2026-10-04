import { describe, expect, it } from 'vitest';

import { estimateCostUsd } from './cost.service';

describe('budget math helpers', () => {
  it('keeps cost below a $1 budget for tiny traffic', () => {
    const cost = estimateCostUsd('gpt-4o-mini', 1000, 1000);
    expect(cost).toBeLessThan(1);
  });
});
