import { describe, it, expect } from 'vitest';
import { pegsInBottle, isValidLiquorBottleSizeCatalog } from '../catalog';

describe('regulated bottle catalog', () => {
  it('750 ml → 12 large pegs (60 ml), remainder 30 ml', () => {
    expect(pegsInBottle(750, 60)).toEqual({ whole: 12, remainderMl: 30 });
  });
  it('750 ml → 25 small pegs (30 ml), no remainder', () => {
    expect(pegsInBottle(750, 30)).toEqual({ whole: 25, remainderMl: 0 });
  });
  it('180 ml → 6 small pegs', () => {
    expect(pegsInBottle(180, 30)).toEqual({ whole: 6, remainderMl: 0 });
  });
  it('rejects 700 ml', () => {
    expect(isValidLiquorBottleSizeCatalog(700)).toBe(false);
  });
});
