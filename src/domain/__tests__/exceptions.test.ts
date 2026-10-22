import { describe, it, expect } from 'vitest';
import { 
  classifyReconciliation, 
  determineSeverityByMagnitude, 
  calculateFinancialImpact,
  applySeverityRules,
  calculateVarianceValue,
  decomposeLiquorStock,
  isValidLiquorBottleSizeException,
  filterExceptions,
  sortExceptions,
  paginateExceptions,
  detectRecurrencePatterns,
  getExceptionsByClassification,
  getExceptionsBySeverity,
  getUnresolvedExceptions,
  getHighPriorityExceptions,
  getRepeatedDiscrepancies,
  getFinancialImpactSummary,
  type ExceptionClassification,
  type ExceptionSeverity,
  type ReconciliationData
} from '../exceptions';

describe('Exception Classification Engine', () => {
  const createMockData = (overrides: Partial<ReconciliationData> = {}): ReconciliationData => ({
    productId: 'p1',
    productName: 'Test Product',
    category: 'liquor',
    unit: 'ml',
    bottleSizeMl: 750,
    opening: 10000,
    receipts: 500,
    consumption: 300,
    spillage: 0,
    transferIn: 0,
    transferOut: 0,
    adjustments: 0,
    expectedClosing: 10200,
    physicalCount: 10000,
    variance: -200,
    unitCost: 50,
    costUnit: 'ml',
    ...overrides,
  });

  const mockMovements = [
    { type: 'opening' as const, amount: 10000, unit: 'ml', reason: null, createdBy: 'u1', createdAt: '2024-01-01' },
    { type: 'receipt' as const, amount: 500, unit: 'ml', reason: null, createdBy: 'u1', createdAt: '2024-01-01' },
    { type: 'consumption' as const, amount: 300, unit: 'ml', reason: null, createdBy: 'u1', createdAt: '2024-01-01' },
  ];

  const mockRecordedLosses = [
    { type: 'spillage' as const, amount: 0, unit: 'ml', reason: null, createdBy: 'u1', createdAt: '2024-01-01' },
  ];

  const mockPhysicalRecord = { amount: 10000, unit: 'ml' };

  describe('classifyReconciliation', () => {
    it('classifies reconciled when variance is 0', () => {
      const data = createMockData({ physicalCount: 10200, variance: 0 });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 1);
      expect(result.classification).toBe('reconciled');
      expect(result.severity).toBe('informational');
    });

    it('classifies recorded_loss when spillage explains shortage', () => {
      const data = createMockData({ physicalCount: 10000, variance: -200, spillage: 200 });
      const recordedLosses = [{ type: 'spillage' as const, amount: 200, unit: 'ml', reason: 'broken bottle', createdBy: 'u1', createdAt: '2024-01-01' }];
      const result = classifyReconciliation(data, mockMovements, recordedLosses, mockPhysicalRecord, 1);
      expect(result.classification).toBe('recorded_loss');
      expect(result.severity).toBe('low');
    });

    it('classifies unexplained_discrepancy when shortage not explained by spillage', () => {
      const data = createMockData({ physicalCount: 10000, variance: -200, spillage: 0 });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 1);
      expect(result.classification).toBe('unexplained_discrepancy');
      expect(result.severity).toBe('medium');
    });

    it('classifies unexplained_discrepancy with partial spillage', () => {
      const data = createMockData({ physicalCount: 10000, variance: -300, spillage: 100 });
      const recordedLosses = [{ type: 'spillage' as const, amount: 100, unit: 'ml', reason: 'spill', createdBy: 'u1', createdAt: '2024-01-01' }];
      const result = classifyReconciliation(data, mockMovements, recordedLosses, mockPhysicalRecord, 1);
      expect(result.classification).toBe('unexplained_discrepancy');
      expect(result.reasoning.some(r => r.includes('partially explains'))).toBe(true);
    });

    it('classifies potential_duplicate_movement when excess could be duplicate receipt', () => {
      const data = createMockData({ physicalCount: 10700, variance: 500, receipts: 500 });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 1);
      expect(result.classification).toBe('potential_duplicate_movement');
      expect(result.severity).toBe('high');
    });

    it('classifies stock_excess when excess not explained by receipts', () => {
      const data = createMockData({ physicalCount: 10500, variance: 300, receipts: 0 });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 1);
      expect(result.classification).toBe('stock_excess');
      expect(result.severity).toBe('medium');
    });

    it('classifies incomplete_reconciliation when physical count is null', () => {
      const data = createMockData({ physicalCount: null, variance: null });
      const result = classifyReconciliation(data, mockMovements, [], null, 1);
      expect(result.classification).toBe('incomplete_reconciliation');
      expect(result.severity).toBe('medium');
    });

    it('classifies invalid_data when physical count is negative', () => {
      const data = createMockData({ physicalCount: -100, variance: -10200 });
      const result = classifyReconciliation(data, mockMovements, [], { amount: -100, unit: 'ml' }, 1);
      expect(result.classification).toBe('invalid_data');
      expect(result.severity).toBe('high');
    });

    it('elevates severity for recurrence', () => {
      const data = createMockData({ physicalCount: 10000, variance: -200 });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 3);
      expect(result.severity).toBe('high');
    });

    it('calculates financial impact for liquor with unit cost', () => {
      const data = createMockData({ physicalCount: 10000, variance: -200, unitCost: 50, costUnit: 'ml' });
      const result = classifyReconciliation(data, mockMovements, [], mockPhysicalRecord, 1);
      expect(result.financialImpact).toBe(-10000); // -200 * 50
    });
  });

  describe('determineSeverityByMagnitude', () => {
    it('returns critical for large shortage relative to expected', () => {
      expect(determineSeverityByMagnitude(-1000, 1000, createMockData())).toBe('critical');
    });

    it('returns high for moderate shortage', () => {
      expect(determineSeverityByMagnitude(-250, 1000, createMockData())).toBe('high');
    });

    it('returns medium for small shortage', () => {
      expect(determineSeverityByMagnitude(-150, 1000, createMockData())).toBe('medium');
    });

    it('returns low for small shortage', () => {
      expect(determineSeverityByMagnitude(-80, 1000, createMockData())).toBe('low');
    });

    it('returns informational for minimal shortage', () => {
      expect(determineSeverityByMagnitude(-30, 1000, createMockData())).toBe('informational');
    });

    it('returns high for large excess', () => {
      expect(determineSeverityByMagnitude(600, 1000, createMockData())).toBe('high');
    });
  });

  describe('calculateFinancialImpact', () => {
    it('calculates impact for liquor with ml cost', () => {
      const data = createMockData({ unitCost: 50, costUnit: 'ml', variance: -200 });
      const impact = calculateFinancialImpact(-200, data);
      expect(impact).toBe(-10000);
    });

    it('calculates impact for liquor with litre cost', () => {
      const data = createMockData({ unitCost: 50000, costUnit: 'litre', variance: -200 });
      const impact = calculateFinancialImpact(-200, data);
      expect(impact).toBe(-10000);
    });

    it('calculates impact using bottle size', () => {
      const data = createMockData({ unitCost: 37500, costUnit: 'bottle', bottleSizeMl: 750, variance: -200 });
      const impact = calculateFinancialImpact(-200, data);
      expect(impact).toBe(-10000);
    });

    it('returns undefined when no cost data', () => {
      const data = createMockData({ unitCost: undefined, costUnit: undefined, variance: -200 });
      const impact = calculateFinancialImpact(-200, data);
      expect(impact).toBeUndefined();
    });
  });

  describe('applySeverityRules', () => {
    it('elevates to high for invalid_data classification', () => {
      const result = applySeverityRules('invalid_data', 'low', {
        recurrenceCount: 1,
        financialImpact: undefined,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('high');
      expect(result.reasons).toContain('Data integrity issue detected');
    });

    it('elevates to high for potential_duplicate_movement', () => {
      const result = applySeverityRules('potential_duplicate_movement', 'medium', {
        recurrenceCount: 1,
        financialImpact: undefined,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('high');
    });

    it('does not elevate for financial impact on operational discrepancies', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'medium', {
        recurrenceCount: 1,
        financialImpact: 15000,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      // Financial impact escalation only applies to data integrity issues (potential_duplicate_movement, invalid_data)
      // unexplained_discrepancy has minimum severity 'medium' but no financial impact escalation
      expect(result.severity).toBe('medium');
    });

    it('elevates severity for recurrence count >= 5', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 5,
        financialImpact: 0,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('critical');
    });

    it('elevates severity for long unresolved', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 1,
        financialImpact: 0,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      });
      expect(result.severity).toBe('high');
    });

    it('elevates for repeated issues over 60 days', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 3,
        financialImpact: 0,
        firstDetectedDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('critical');
    });
  });

  describe('calculateFinancialImpact', () => {
    it('returns undefined when no unit cost', () => {
      const data = createMockData({ unitCost: undefined });
      expect(calculateFinancialImpact(-200, data)).toBeUndefined();
    });

    it('returns undefined when variance is 0', () => {
      const data = createMockData({ unitCost: 50, costUnit: 'ml', variance: 0 });
      expect(calculateFinancialImpact(0, data)).toBe(0);
    });

    it('handles litre cost unit', () => {
      const data = createMockData({ unitCost: 50000, costUnit: 'litre', variance: -1000 });
      const impact = calculateFinancialImpact(-1000, data);
      expect(impact).toBe(-50000);
    });
  });

  describe('applySeverityRules', () => {
    it('elevates severity for invalid_data', () => {
      const result = applySeverityRules('invalid_data', 'low', {
        recurrenceCount: 1,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('high');
    });

    it('does not elevate for financial impact on operational discrepancies', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 1,
        financialImpact: 15000,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      // Financial impact escalation only applies to data integrity issues (potential_duplicate_movement, invalid_data)
      // unexplained_discrepancy has minimum severity 'medium' but no financial impact escalation
      expect(result.severity).toBe('medium');
    });

    it('elevates for recurrence >= 3', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 3,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(),
      });
      expect(result.severity).toBe('high');
    });

    it('elevates for long unresolved', () => {
      const result = applySeverityRules('unexplained_discrepancy', 'low', {
        recurrenceCount: 1,
        firstDetectedDate: new Date(),
        lastDetectedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      });
      expect(result.severity).toBe('high');
    });
  });

  describe('calculateVarianceValue', () => {
    it('calculates for ml cost', () => {
      const value = calculateVarianceValue(-200, { unitCost: 50, costUnit: 'ml' });
      expect(value).toBe(-10000);
    });

    it('calculates for litre cost', () => {
      const value = calculateVarianceValue(-1000, { unitCost: 50000, costUnit: 'litre' });
      expect(value).toBe(-50000);
    });

    it('calculates for bottle cost', () => {
      const value = calculateVarianceValue(-200, { unitCost: 37500, costUnit: 'bottle', bottleSizeMl: 750 });
      expect(value).toBe(-10000);
    });

    it('handles count-based products', () => {
      const value = calculateVarianceValue(-5, { unitCost: 100, costUnit: 'bottle' });
      expect(value).toBe(-500);
    });

    it('returns undefined when no cost basis', () => {
      const value = calculateVarianceValue(-200, { unitCost: 0, costUnit: 'ml' });
      expect(value).toBeUndefined();
    });
  });

  describe('decomposeLiquorStock', () => {
    it('decomposes 9240ml at 750ml bottle', () => {
      const result = decomposeLiquorStock(9240, 750);
      expect(result).toEqual({ fullBottles: 12, looseMl: 240, bottleSizeMl: 750, totalMl: 9240 });
    });

    it('rejects invalid bottle size', () => {
      expect(() => decomposeLiquorStock(1000, 700)).toThrow('Invalid bottle size');
    });

    it('rejects negative total', () => {
      expect(() => decomposeLiquorStock(-100, 750)).toThrow('totalMl must be >= 0');
    });
  });

  describe('isValidLiquorBottleSizeException', () => {
    it('accepts valid sizes', () => {
      expect(isValidLiquorBottleSizeException(750)).toBe(true);
      expect(isValidLiquorBottleSizeException(375)).toBe(true);
      expect(isValidLiquorBottleSizeException(60)).toBe(true);
    });

    it('rejects invalid sizes', () => {
      expect(isValidLiquorBottleSizeException(700)).toBe(false);
      expect(isValidLiquorBottleSizeException(100)).toBe(false);
    });
  });
});

  describe('filterExceptions', () => {
    const mockExceptions = [
      { id: '1', classification: 'unexplained_discrepancy', severity: 'high', state: 'open', category: 'liquor', productId: 'p1', varianceQty: -100, estimatedFinancialImpact: 5000 } as any,
      { id: '2', classification: 'recorded_loss', severity: 'low', state: 'resolved_explained', category: 'beer', productId: 'p2', varianceQty: -50, estimatedFinancialImpact: 1000 } as any,
      { id: '3', classification: 'stock_excess', severity: 'medium', state: 'open', category: 'liquor', productId: 'p3', varianceQty: 100, estimatedFinancialImpact: 2000 } as any,
    ];

    it('filters by classification', () => {
      const result = filterExceptions(mockExceptions, { classification: 'unexplained_discrepancy' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by severity', () => {
      const result = filterExceptions(mockExceptions, { severity: 'high' });
      expect(result).toHaveLength(1);
    });

    it('filters by state', () => {
      const result = filterExceptions(mockExceptions, { state: 'open' });
      expect(result).toHaveLength(2);
    });

    it('filters by category', () => {
      const result = filterExceptions(mockExceptions, { category: 'liquor' });
      expect(result).toHaveLength(2);
    });

    it('filters by variance direction', () => {
      const neg = filterExceptions(mockExceptions, { varianceDirection: 'negative' });
      expect(neg).toHaveLength(2);
      expect(neg.map(n => n.id).sort()).toEqual(['1', '2']);

      const pos = filterExceptions(mockExceptions, { varianceDirection: 'positive' });
      expect(pos).toHaveLength(1);
      expect(pos[0].id).toBe('3');
    });

    it('filters by financial impact', () => {
      const withImpact = filterExceptions(mockExceptions, { hasFinancialImpact: true });
      expect(withImpact).toHaveLength(3);

      const withoutImpact = filterExceptions([...mockExceptions, { id: '4', classification: 'reconciled', severity: 'informational', state: 'open', category: 'water', productId: 'p4', varianceQty: 0, estimatedFinancialImpact: null } as any], { hasFinancialImpact: false });
      expect(withoutImpact).toHaveLength(1);
    });
  });

  describe('sortExceptions', () => {
    const mockExceptions = [
      { id: '1', severity: 'low', firstDetectedDate: new Date('2024-01-01'), varianceQty: -100 } as any,
      { id: '2', severity: 'high', firstDetectedDate: new Date('2024-01-02'), varianceQty: -200 } as any,
      { id: '3', severity: 'medium', firstDetectedDate: new Date('2024-01-03'), varianceQty: -50 } as any,
    ];

    it('sorts by severity desc', () => {
      const result = sortExceptions(mockExceptions, 'severity', 'desc');
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('sorts by severity asc', () => {
      const result = sortExceptions(mockExceptions, 'severity', 'asc');
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('2');
    });

    it('sorts by date desc', () => {
      const result = sortExceptions(mockExceptions, 'firstDetectedDate', 'desc');
      expect(result[0].id).toBe('3');
      expect(result[2].id).toBe('1');
    });
  });

  describe('paginateExceptions', () => {
    const mockExceptions = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) } as any));

    it('returns correct page', () => {
      const result = paginateExceptions(mockExceptions, 1, 10);
      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('returns last page correctly', () => {
      const result = paginateExceptions(mockExceptions, 3, 10);
      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(3);
    });
  });

  describe('detectRecurrencePatterns', () => {
    const mockExceptions = [
      { id: '1', productId: 'p1', productName: 'Product 1', classification: 'unexplained_discrepancy', firstDetectedDate: new Date('2024-01-01'), lastDetectedDate: new Date('2024-01-10'), varianceQty: -100 } as any,
      { id: '2', productId: 'p1', productName: 'Product 1', classification: 'unexplained_discrepancy', firstDetectedDate: new Date('2024-01-05'), lastDetectedDate: new Date('2024-01-15'), varianceQty: -150 } as any,
      { id: '3', productId: 'p1', productName: 'Product 1', classification: 'unexplained_discrepancy', firstDetectedDate: new Date('2024-01-10'), lastDetectedDate: new Date('2024-01-20'), varianceQty: -200 } as any,
      { id: '4', productId: 'p2', productName: 'Product 2', classification: 'unexplained_discrepancy', firstDetectedDate: new Date('2024-01-01'), lastDetectedDate: new Date('2024-01-05'), varianceQty: -50 } as any,
    ];

    it('detects recurrence patterns', () => {
      const patterns = detectRecurrencePatterns(mockExceptions, 3, 30);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].productId).toBe('p1');
      expect(patterns[0].count).toBe(3);
      expect(patterns[0].isEscalating).toBe(true);
    });

    it('respects minOccurrences', () => {
      const patterns = detectRecurrencePatterns(mockExceptions, 4, 30);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('filter helpers', () => {
    const mockExceptions = [
      { classification: 'unexplained_discrepancy', severity: 'high', state: 'open' } as any,
      { classification: 'recorded_loss', severity: 'low', state: 'resolved_explained' } as any,
      { classification: 'stock_excess', severity: 'medium', state: 'open' } as any,
      { classification: 'unexplained_discrepancy', severity: 'critical', state: 'under_review' } as any,
    ];

    it('getExceptionsByClassification', () => {
      const result = getExceptionsByClassification(mockExceptions, 'unexplained_discrepancy');
      expect(result).toHaveLength(2);
    });

    it('getExceptionsBySeverity', () => {
      const result = getExceptionsBySeverity(mockExceptions, 'high');
      expect(result).toHaveLength(1);
    });

    it('getUnresolvedExceptions', () => {
      const result = getUnresolvedExceptions(mockExceptions);
      expect(result).toHaveLength(3);
    });

    it('getHighPriorityExceptions', () => {
      const result = getHighPriorityExceptions(mockExceptions);
      expect(result).toHaveLength(2);
    });

    it('getRepeatedDiscrepancies', () => {
      const exceptions = [
        { recurrenceCount: 3 } as any,
        { recurrenceCount: 1 } as any,
        { recurrenceCount: 5 } as any,
      ];
      const result = getRepeatedDiscrepancies(exceptions, 3);
      expect(result).toHaveLength(2);
    });
  });

  describe('getFinancialImpactSummary', () => {
    const mockExceptions = [
      { classification: 'unexplained_discrepancy', severity: 'high', estimatedFinancialImpact: 5000 } as any,
      { classification: 'unexplained_discrepancy', severity: 'medium', estimatedFinancialImpact: 3000 } as any,
      { classification: 'recorded_loss', severity: 'low', estimatedFinancialImpact: 1000 } as any,
      { classification: 'stock_excess', severity: 'medium', estimatedFinancialImpact: null } as any,
    ];

    it('calculates summary correctly', () => {
      const summary = getFinancialImpactSummary(mockExceptions);
      expect(summary.totalImpact).toBe(9000);
      expect(summary.byClassification.unexplained_discrepancy).toBe(8000);
      expect(summary.byClassification.recorded_loss).toBe(1000);
      expect(summary.bySeverity.high).toBe(5000);
      expect(summary.countWithCostData).toBe(3);
      expect(summary.countWithoutCostData).toBe(1);
    });
  });

  describe('calculateVarianceValue', () => {
    it('calculates for ml cost', () => {
      expect(calculateVarianceValue(-200, { unitCost: 50, costUnit: 'ml' })).toBe(-10000);
    });

    it('calculates for litre cost', () => {
      expect(calculateVarianceValue(-1000, { unitCost: 50000, costUnit: 'litre' })).toBe(-50000);
    });

    it('calculates for bottle cost', () => {
      expect(calculateVarianceValue(-200, { unitCost: 37500, costUnit: 'bottle', bottleSizeMl: 750 })).toBe(-10000);
    });

    it('handles count-based products', () => {
      expect(calculateVarianceValue(-5, { unitCost: 100, costUnit: 'bottle' })).toBe(-500);
    });

    it('returns undefined when no cost basis', () => {
      expect(calculateVarianceValue(-200, { unitCost: 0, costUnit: 'ml' })).toBeUndefined();
    });
  });

  describe('decomposeLiquorStock', () => {
    it('decomposes correctly', () => {
      expect(decomposeLiquorStock(9240, 750)).toEqual({ fullBottles: 12, looseMl: 240, bottleSizeMl: 750, totalMl: 9240 });
    });

    it('rejects invalid bottle size', () => {
      expect(() => decomposeLiquorStock(1000, 700)).toThrow('Invalid bottle size');
    });

    it('rejects negative total', () => {
      expect(() => decomposeLiquorStock(-100, 750)).toThrow('totalMl must be >= 0');
    });
  });

  describe('isValidLiquorBottleSizeException', () => {
    it('accepts valid sizes', () => {
      expect(isValidLiquorBottleSizeException(750)).toBe(true);
      expect(isValidLiquorBottleSizeException(375)).toBe(true);
      expect(isValidLiquorBottleSizeException(60)).toBe(true);
    });

    it('rejects invalid sizes', () => {
      expect(isValidLiquorBottleSizeException(700)).toBe(false);
      expect(isValidLiquorBottleSizeException(100)).toBe(false);
    });
  });
