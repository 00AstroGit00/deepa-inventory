import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, toCsv } from '../csvSafe';

describe('CSV formula injection', () => {
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1)', '\tx', '\rx'])(
    'neutralises %s', v => expect(sanitizeCsvCell(v)).toBe(`'${v}`),
  );
  it('leaves ordinary text untouched', () => {
    expect(sanitizeCsvCell('Kingfisher 650ml')).toBe('Kingfisher 650ml');
  });
  it('quotes cells with commas', () => {
    const csv = toCsv(['a'], [{ a: 'x,y' }]);
    expect(csv.split('\r\n')[1]).toBe('"x,y"');
  });
});
