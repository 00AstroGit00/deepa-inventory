const RISKY = /^[=+\-@\t\r]/;

export function sanitizeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return RISKY.test(s) ? `'${s}` : s;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const esc = (v: string) => /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [headers.map(h => esc(sanitizeCsvCell(h))).join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => esc(sanitizeCsvCell(r[h]))).join(','));
  }
  return lines.join('\r\n');
}
