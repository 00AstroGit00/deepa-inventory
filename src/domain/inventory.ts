import { roundQty } from './units';

export type MovementType =
  | 'opening' | 'receipt' | 'transfer_in' | 'transfer_out'
  | 'consumption' | 'spillage' | 'adjustment';

export interface Movement { type: MovementType; amount: number; }

const SIGN: Record<MovementType, 1 | -1> = {
  opening: +1, receipt: +1, transfer_in: +1, adjustment: +1,
  consumption: -1, spillage: -1, transfer_out: -1,
};

export function expectedClosing(opening: number, movements: Movement[]): number {
  let total = opening;
  for (const m of movements) {
    if (!Number.isFinite(m.amount)) throw new Error('non-finite movement');
    if (m.type !== 'adjustment' && m.amount < 0)
      throw new Error(`${m.type} amount must be >= 0`);
    total += SIGN[m.type] * m.amount;
  }
  return roundQty(total);
}

export function variance(physical: number, expected: number): number {
  return roundQty(physical - expected);
}

export interface ReconciliationRow {
  productId: string;
  productName: string;
  unit: string;
  opening: number;
  receipts: number;
  consumption: number;
  spillage: number;
  transferIn: number;
  transferOut: number;
  adjustments: number;
  expectedClosing: number;
  physicalCount: number | null;
  variance: number | null;
}

export function buildReconciliation(
  base: Omit<ReconciliationRow, 'expectedClosing' | 'variance'>,
): ReconciliationRow {
  const expected = expectedClosing(base.opening, [
    { type: 'receipt', amount: base.receipts },
    { type: 'consumption', amount: base.consumption },
    { type: 'spillage', amount: base.spillage },
    { type: 'transfer_in', amount: base.transferIn },
    { type: 'transfer_out', amount: base.transferOut },
    { type: 'adjustment', amount: base.adjustments },
  ]);
  return {
    ...base,
    expectedClosing: expected,
    variance: base.physicalCount == null ? null : variance(base.physicalCount, expected),
  };
}
