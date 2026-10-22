import { describe, it, expect } from 'vitest';
import { totalLiquorMl, decomposeLiquor } from '../liquor';

describe('liquor engine', () => {
  it('sums 12 × 750 ml + 240 ml loose = 9240 ml', () => {
    expect(totalLiquorMl({ fullBottles: 12, bottleSizeMl: 750, looseMl: 240 })).toBe(9240);
  });
  it('decomposes 9240 ml into 12 + 240', () => {
    expect(decomposeLiquor(9240, 750))
      .toEqual({ fullBottles: 12, bottleSizeMl: 750, looseMl: 240 });
  });
  it('rejects negative bottles', () => {
    expect(() => totalLiquorMl({ fullBottles: -1, bottleSizeMl: 750, looseMl: 0 })).toThrow();
  });
  it('rejects loose >= bottle', () => {
    expect(() => totalLiquorMl({ fullBottles: 1, bottleSizeMl: 750, looseMl: 750 })).toThrow();
  });
});
