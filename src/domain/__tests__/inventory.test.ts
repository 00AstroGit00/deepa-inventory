import { describe, it, expect } from 'vitest';
import { expectedClosing, variance, buildReconciliation } from '../inventory';

describe('expected closing', () => {
  it('liquor: 9000+1500-300-60-100 = 10040 ml', () => {
    expect(expectedClosing(9000, [
      { type: 'receipt', amount: 1500 },
      { type: 'consumption', amount: 300 },
      { type: 'spillage', amount: 60 },
      { type: 'adjustment', amount: -100 },
    ])).toBe(10040);
  });
  it('beer: 24+12-5 = 31 bottles', () => {
    expect(expectedClosing(24, [
      { type: 'receipt', amount: 12 },
      { type: 'consumption', amount: 5 },
    ])).toBe(31);
  });
  it('rejects negative non-adjustment movements', () => {
    expect(() => expectedClosing(10, [{ type: 'receipt', amount: -1 }])).toThrow();
  });
  it('variance sign: short stock is negative', () => {
    expect(variance(30, 31)).toBe(-1);
    expect(variance(31, 31)).toBe(0);
  });
});

describe('buildReconciliation', () => {
  it('computes expected and variance together', () => {
    const row = buildReconciliation({
      productId: 'p', productName: 'Kingfisher', unit: 'bottle',
      opening: 24, receipts: 12, consumption: 5, spillage: 0,
      transferIn: 0, transferOut: 0, adjustments: 0, physicalCount: 30,
    });
    expect(row.expectedClosing).toBe(31);
    expect(row.variance).toBe(-1);
  });
  it('leaves variance null when no count', () => {
    const row = buildReconciliation({
      productId: 'p', productName: 'Water', unit: 'bottle',
      opening: 0, receipts: 0, consumption: 0, spillage: 0,
      transferIn: 0, transferOut: 0, adjustments: 0, physicalCount: null,
    });
    expect(row.variance).toBeNull();
  });
});
