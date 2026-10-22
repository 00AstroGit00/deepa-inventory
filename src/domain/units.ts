export type Unit = 'ml' | 'litre' | 'bottle' | 'tin' | 'can' | 'case' | 'piece';
export type Dimension = 'volume' | 'count';

const DIMENSION: Record<Unit, Dimension> = {
  ml: 'volume', litre: 'volume',
  bottle: 'count', tin: 'count', can: 'count', case: 'count', piece: 'count',
};

export const dimensionOf = (u: Unit): Dimension => DIMENSION[u];

export interface Quantity { readonly amount: number; readonly unit: Unit; }

export function toCanonical(q: Quantity): Quantity {
  if (dimensionOf(q.unit) === 'volume') {
    const factor = q.unit === 'litre' ? 1000 : 1;
    return { amount: q.amount * factor, unit: 'ml' };
  }
  return q;
}

export function assertCompatible(a: Unit, b: Unit): void {
  if (dimensionOf(a) !== dimensionOf(b)) {
    throw new Error(`Incompatible units: ${a} vs ${b}`);
  }
}

export const roundQty = (n: number): number => Math.round(n * 10000) / 10000;
