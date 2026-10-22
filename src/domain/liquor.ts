export interface LiquorBreakdown {
  fullBottles: number;
  bottleSizeMl: number;
  looseMl: number;
}

export function totalLiquorMl(b: LiquorBreakdown): number {
  if (!Number.isFinite(b.fullBottles) || b.fullBottles < 0)
    throw new Error('fullBottles must be >= 0');
  if (!Number.isFinite(b.looseMl) || b.looseMl < 0)
    throw new Error('looseMl must be >= 0');
  if (!Number.isFinite(b.bottleSizeMl) || b.bottleSizeMl <= 0)
    throw new Error('bottleSizeMl must be > 0');
  if (b.looseMl >= b.bottleSizeMl)
    throw new Error('looseMl must be less than one full bottle');
  return b.fullBottles * b.bottleSizeMl + b.looseMl;
}

export function decomposeLiquor(totalMl: number, bottleSizeMl: number): LiquorBreakdown {
  if (totalMl < 0) throw new Error('totalMl must be >= 0');
  const fullBottles = Math.floor(totalMl / bottleSizeMl);
  const looseMl = +(totalMl - fullBottles * bottleSizeMl).toFixed(3);
  return { fullBottles, bottleSizeMl, looseMl };
}
