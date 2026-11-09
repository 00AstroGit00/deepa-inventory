import type { MovementType } from './inventory';
import { roundQty } from './units';
import type { ReconciliationRow } from './inventory';

// ============================================================================
// Types
// ============================================================================

export type ExceptionClassification = 
  | 'reconciled'
  | 'stock_shortage'
  | 'stock_excess'
  | 'recorded_loss'
  | 'unexplained_discrepancy'
  | 'potential_duplicate_movement'
  | 'invalid_data'
  | 'incomplete_reconciliation'
  | 'repeated_discrepancy'
  | 'unusual_movement_pattern';

export type ExceptionSeverity = 
  | 'informational'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type InvestigationState = 
  | 'open'
  | 'under_review'
  | 'awaiting_information'
  | 'resolved_explained'
  | 'corrected_adjustment'
  | 'closed_approved'
  | 'reopened';

export type ResolutionType = 
  | 'explained_no_change'
  | 'counting_error_corrected'
  | 'unit_product_error_corrected'
  | 'missing_movement_identified'
  | 'duplicate_movement_removed'
  | 'approved_adjustment'
  | 'unresolved_discrepancy'
  | 'incomplete_investigation';

export interface ReconciliationData {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  bottleSizeMl?: number;
  packageSizeAmount?: number;
  packageSizeUnit?: string;
  reorderLevel?: number;
  opening: number;
  receipts: number;
  consumption: number;
  spillage: number;
  transferIn: number;
  transferOut: number;
  adjustments: number;
  expectedClosing: number;
  physicalCount: number | undefined;
  variance: number | undefined;
  unitCost?: number;
  costUnit?: string;
}

export interface ExceptionClassificationResult {
  classification: ExceptionClassification;
  severity: ExceptionSeverity;
  reasoning: string[];
  financialImpact?: number;
  isRecurring: boolean;
  recurrenceCount: number;
  firstDetected?: Date;
  lastDetected?: Date;
}

export interface MovementRecord {
  type: MovementType;
  amount: number;
  unit: string;
  reason: string | undefined;
  createdBy: string;
  createdAt: string;
}

export interface RecordedLoss {
  type: 'spillage' | 'adjustment';
  amount: number;
  unit: string;
  reason: string | undefined;
  createdBy: string;
  createdAt: string;
}

export interface PhysicalCountRecord {
  amount: number;
  unit: string;
  enteredBy: string;
  enteredAt: string;
}

export interface ExceptionDetail {
  id: string;
  inventoryDayId: string;
  productId: string;
  productName: string;
  category: string;
  classification: ExceptionClassification;
  severity: ExceptionSeverity;
  state: string;
  openingQty: number;
  expectedClosingQty: number;
  physicalQty: number | undefined;
  varianceQty: number | null;
  unit: string;
  unitCost?: number;
  costUnit?: string;
  estimatedFinancialImpact?: number;
  expectedClosingMovements: Record<string, number>;
  recordedLosses: RecordedLoss[];
  physicalCountRecord: PhysicalCountRecord | undefined;
  recurrenceCount: number;
  firstDetectedDate: Date;
  lastDetectedDate: Date;
  assignedTo?: string;
  assignedAt?: Date;
  firstReviewedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionType?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExceptionDashboardStats {
  totalExceptions: number;
  byClassification: Record<string, number>;
  bySeverity: Record<string, number>;
  byState: Record<string, number>;
  repeatedDiscrepancies: number;
  unresolvedHighCritical: number;
  totalEstimatedImpact: number;
  recordedLossesVolume: number;
  unexplainedDiscrepancies: number;
  pendingReviews: number;
}

export interface ExceptionFilter {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  productId?: string;
  classification?: ExceptionClassification;
  severity?: ExceptionSeverity;
  state?: string;
  assignedTo?: string;
  varianceDirection?: 'positive' | 'negative' | 'zero';
  hasFinancialImpact?: boolean;
}

export interface PaginatedExceptions {
  exceptions: ExceptionDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Classification Engine
// ============================================================================

/**
 * Classifies a reconciliation row into an exception classification
 * Returns the classification, severity, and reasoning
 */
export function classifyReconciliation(
  data: ReconciliationData,
  movements: Array<{ type: MovementType; amount: number; unit: string; reason: string | undefined; createdBy: string; createdAt: string }>,
  recordedLosses: Array<{ type: 'spillage' | 'adjustment'; amount: number; unit: string; reason: string | undefined }>,
  physicalRecord: { amount: number; unit: string } | undefined,
  recurrenceCount: number = 1,
  firstDetected?: Date,
  lastDetected?: Date
): ExceptionClassificationResult {
  const applySeverity = (result: ExceptionClassificationResult): ExceptionClassificationResult => {
    const { severity: finalSeverity, reasons } = applySeverityRules(
      result.classification,
      result.severity,
      {
        recurrenceCount: result.recurrenceCount,
        financialImpact: result.financialImpact,
        firstDetectedDate: result.firstDetected,
        lastDetectedDate: result.lastDetected,
      }
    );
    return { ...result, severity: finalSeverity, reasoning: [...result.reasoning, ...reasons] };
  };
  
  const varianceValue = data.variance !== undefined && data.variance !== null ? data.variance : 0;
  const physicalCount = data.physicalCount !== undefined ? data.physicalCount : undefined;
  
  if (physicalCount === undefined) {
    return applySeverity({
      classification: 'incomplete_reconciliation',
      severity: 'medium',
      reasoning: ['Physical count not entered for this product'],
      isRecurring: false,
      recurrenceCount: recurrenceCount,
      firstDetected: new Date(),
      lastDetected: new Date(),
    });
  }
  
  if (physicalCount < 0) {
    return applySeverity({
      classification: 'invalid_data',
      severity: 'high',
      reasoning: ['Physical count cannot be negative'],
      isRecurring: false,
      recurrenceCount: recurrenceCount,
      firstDetected: new Date(),
      lastDetected: new Date(),
    });
  }
  
  const totalSpillage = recordedLosses
    .filter(l => l.type === 'spillage')
    .reduce((sum, loss) => sum + loss.amount, 0);
  
  // Negative variance = shortage (physical count < expected closing)
  if (varianceValue < 0) {
    const absVariance = Math.abs(varianceValue);
    
    if (totalSpillage > 0 && totalSpillage >= absVariance) {
      return applySeverity({
        classification: 'recorded_loss',
        severity: 'low',
        reasoning: [
          `Recorded spillage (${totalSpillage} ${data.unit}) explains the shortage (${absVariance} ${data.unit})`,
        ],
        financialImpact: calculateFinancialImpact(varianceValue, data),
        isRecurring: false,
        recurrenceCount: recurrenceCount,
        firstDetected: new Date(),
        lastDetected: new Date(),
      });
    }
    
    if (totalSpillage > 0 && totalSpillage < absVariance) {
      const unexplained = absVariance - totalSpillage;
      return applySeverity({
        classification: 'unexplained_discrepancy',
        severity: determineSeverityByMagnitude(unexplained, data.expectedClosing, data),
        reasoning: [
          `Recorded spillage (${totalSpillage} ${data.unit}) partially explains shortage`,
          `Unexplained shortage: ${unexplained} ${data.unit}`,
        ],
        financialImpact: calculateFinancialImpact(unexplained * -1, data),
        isRecurring: false,
        recurrenceCount: recurrenceCount,
        firstDetected: new Date(),
        lastDetected: new Date(),
      });
    }
    
    return applySeverity({
      classification: 'unexplained_discrepancy',
      severity: 'medium',
      reasoning: [`Unexplained shortage of ${absVariance} ${data.unit}`],
      financialImpact: calculateFinancialImpact(varianceValue, data),
      isRecurring: false,
      recurrenceCount: recurrenceCount,
      firstDetected: new Date(),
      lastDetected: new Date(),
    });
  }
  
  // Positive variance = excess (physical count > expected closing)
  if (varianceValue > 0) {
    const absVariance = varianceValue;
    
    if (data.receipts > 0 && data.receipts >= absVariance) {
      return applySeverity({
        classification: 'potential_duplicate_movement',
        severity: 'high',
        reasoning: [
          `Excess (${absVariance} ${data.unit}) could indicate duplicate receipt (${data.receipts} ${data.unit} received)`,
        ],
        financialImpact: calculateFinancialImpact(varianceValue, data),
        isRecurring: false,
        recurrenceCount: recurrenceCount,
        firstDetected: new Date(),
        lastDetected: new Date(),
      });
    }
    
    if (data.transferIn > 0 && data.transferIn >= absVariance) {
      return applySeverity({
        classification: 'potential_duplicate_movement',
        severity: 'high',
        reasoning: [
          `Excess (${absVariance} ${data.unit}) could indicate duplicate transfer in (${data.transferIn} ${data.unit} received)`,
        ],
        financialImpact: calculateFinancialImpact(varianceValue, data),
        isRecurring: false,
        recurrenceCount: recurrenceCount,
        firstDetected: new Date(),
        lastDetected: new Date(),
      });
    }
    
    return applySeverity({
      classification: 'stock_excess',
      severity: 'medium',
      reasoning: [`Unexplained excess of ${absVariance} ${data.unit}`],
      financialImpact: calculateFinancialImpact(varianceValue, data),
      isRecurring: false,
      recurrenceCount: recurrenceCount,
      firstDetected: new Date(),
      lastDetected: new Date(),
    });
  }
  
  // variance === 0
  return applySeverity({
    classification: 'reconciled',
    severity: 'informational',
    reasoning: ['Physical count matches expected closing stock'],
    financialImpact: 0,
    isRecurring: false,
    recurrenceCount: recurrenceCount,
    firstDetected: new Date(),
    lastDetected: new Date(),
  });
}export function determineSeverityByMagnitude(
  variance: number,
  expectedClosing: number,
  data: ReconciliationData
): ExceptionSeverity {
  if (expectedClosing === 0) return 'medium';
  
  const relativeVariance = Math.abs(variance) / expectedClosing;
  
  if (variance < 0) {
    // Shortage severity
    if (relativeVariance > 0.5) return 'critical';
    if (relativeVariance > 0.2) return 'high';
    if (relativeVariance > 0.1) return 'medium';
    if (relativeVariance > 0.05) return 'low';
    return 'informational';
  } else {
    // Excess severity
    if (relativeVariance > 0.5) return 'high';
    if (relativeVariance > 0.2) return 'medium';
    if (relativeVariance > 0.1) return 'low';
    return 'informational';
  }
}

export function calculateFinancialImpact(variance: number, data: ReconciliationData): number | undefined {
  if (!data.unitCost || !data.costUnit) return undefined;
  
  let costPerMl: number;
  const costUnit = data.costUnit.toLowerCase();

  if (costUnit === 'ml') {
    costPerMl = data.unitCost;
  } else if (costUnit === 'litre' || costUnit === 'liter') {
    costPerMl = data.unitCost / 1000;
  } else if (data.bottleSizeMl) {
    // Cost is per bottle, convert to per ml
    costPerMl = data.unitCost / data.bottleSizeMl;
  } else if (costUnit === 'bottle' && data.bottleSizeMl) {
    costPerMl = data.unitCost / data.bottleSizeMl;
  } else {
    // For count-based products, use unit cost directly
    return data.unitCost * variance;
  }
  
  return roundQty(variance * costPerMl);
}

// ============================================================================
// Severity Escalation Rules
// ============================================================================

const severityOrder: Record<ExceptionSeverity, number> = {
  informational: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface SeverityRule {
  condition: (context: {
    classification: ExceptionClassification;
    severity: ExceptionSeverity;
    recurrenceCount: number;
    financialImpact?: number;
    daysSinceFirstDetected: number;
    daysUnresolved: number;
  }) => boolean;
  newSeverity: ExceptionSeverity;
  reason: string;
}

export const DEFAULT_SEVERITY_RULES: SeverityRule[] = [
  // Minimum severity by classification
  {
    condition: (ctx) => ctx.classification === 'unexplained_discrepancy' || ctx.classification === 'stock_excess',
    newSeverity: 'medium',
    reason: 'Minimum severity for unexplained discrepancies and stock excess',
  },
  {
    condition: (ctx) => ctx.classification === 'recorded_loss',
    newSeverity: 'low',
    reason: 'Recorded losses are at minimum low severity',
  },
  {
    condition: (ctx) => ctx.classification === 'incomplete_reconciliation',
    newSeverity: 'medium',
    reason: 'Incomplete reconciliations require attention',
  },
  // Critical data integrity issues
  {
    condition: (ctx) => ctx.classification === 'invalid_data' || ctx.classification === 'potential_duplicate_movement',
    newSeverity: 'high',
    reason: 'Data integrity issue detected',
  },
  // Financial impact - only for data integrity issues (potential duplicates, invalid data), not for operational discrepancies
  {
    condition: (ctx) => 
      (ctx.classification === 'potential_duplicate_movement' || ctx.classification === 'invalid_data') &&
      ctx.financialImpact !== undefined && 
      Math.abs(ctx.financialImpact) > 50000,
    newSeverity: 'critical',
    reason: 'Financial impact exceeds 50,000 for data integrity issues',
  },
  {
    condition: (ctx) => 
      (ctx.classification === 'potential_duplicate_movement' || ctx.classification === 'invalid_data') &&
      ctx.financialImpact !== undefined && 
      Math.abs(ctx.financialImpact) > 20000,
    newSeverity: 'high',
    reason: 'Financial impact exceeds 20,000 for data integrity issues',
  },
  {
    condition: (ctx) => 
      (ctx.classification === 'potential_duplicate_movement' || ctx.classification === 'invalid_data') &&
      ctx.financialImpact !== undefined && 
      Math.abs(ctx.financialImpact) > 5000,
    newSeverity: 'medium',
    reason: 'Financial impact exceeds 5,000 for data integrity issues',
  },
  // Repeated discrepancies
  {
    condition: (ctx) => ctx.recurrenceCount >= 5,
    newSeverity: 'critical',
    reason: 'Repeated 5+ times',
  },
  {
    condition: (ctx) => ctx.recurrenceCount >= 3,
    newSeverity: 'high',
    reason: 'Repeated 3+ times',
  },
  {
    condition: (ctx) => ctx.recurrenceCount >= 2,
    newSeverity: 'medium',
    reason: 'Repeated discrepancy',
  },
  // Long-standing unresolved
  {
    condition: (ctx) => ctx.daysUnresolved > 30,
    newSeverity: 'high',
    reason: 'Unresolved for 30+ days',
  },
  {
    condition: (ctx) => ctx.daysUnresolved > 14,
    newSeverity: 'medium',
    reason: 'Unresolved for 14+ days',
  },
  {
    condition: (ctx) => ctx.daysUnresolved > 7,
    newSeverity: 'low',
    reason: 'Unresolved for 7+ days',
  },
  // Long-standing recurrence
  {
    condition: (ctx) => ctx.daysSinceFirstDetected > 60 && ctx.recurrenceCount >= 3,
    newSeverity: 'critical',
    reason: 'Persistent recurring issue over 60 days',
  },
];

export function applySeverityRules(
  classification: ExceptionClassification,
  baseSeverity: ExceptionSeverity,
  context: {
    recurrenceCount: number;
    financialImpact?: number;
    firstDetectedDate?: Date;
    lastDetectedDate?: Date;
  }
): { severity: ExceptionSeverity; reasons: string[] } {
  const now = new Date();
  const firstDetected = context.firstDetectedDate || new Date();
  const lastDetected = context.lastDetectedDate || new Date();
  
  const contextData = {
    classification,
    severity: baseSeverity,
    recurrenceCount: context.recurrenceCount,
    financialImpact: context.financialImpact,
    daysSinceFirstDetected: Math.floor((now.getTime() - firstDetected.getTime()) / (1000 * 60 * 60 * 24)),
    daysUnresolved: Math.floor((now.getTime() - lastDetected.getTime()) / (1000 * 60 * 60 * 24)),
  };

  let currentSeverity = baseSeverity;
  const reasons: string[] = [];
  
  // Severity order for comparison
  const severityOrder: Record<ExceptionSeverity, number> = {
    informational: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  for (const rule of DEFAULT_SEVERITY_RULES) {
    if (rule.condition(contextData) && severityOrder[rule.newSeverity] > severityOrder[currentSeverity]) {
      currentSeverity = rule.newSeverity;
      reasons.push(rule.reason);
    }
  }

  return { severity: currentSeverity, reasons };
}

// ============================================================================
// Financial Impact Calculation
// ============================================================================

export interface CostBasis {
  unitCost: number;
  costUnit: string;
  bottleSizeMl?: number;
}

export function calculateVarianceValue(
  variance: number,
  costBasis: CostBasis
): number | undefined {
  if (variance === 0 || variance === undefined || variance === undefined) return 0;
  if (!costBasis || !costBasis.unitCost) return undefined;

  let costPerMl: number;
  const costUnit = costBasis.costUnit.toLowerCase();

  if (costUnit === 'ml') {
    costPerMl = costBasis.unitCost;
  } else if (costUnit === 'litre' || costUnit === 'liter') {
    costPerMl = costBasis.unitCost / 1000;
  } else if (costBasis.bottleSizeMl) {
    // Cost is per bottle, convert to per ml
    costPerMl = costBasis.unitCost / costBasis.bottleSizeMl;
  } else if (costUnit === 'bottle' && costBasis.bottleSizeMl) {
    costPerMl = costBasis.unitCost / costBasis.bottleSizeMl;
  } else {
    // For count-based products, use unit cost directly
    return costBasis.unitCost * variance;
  }
  
  return roundQty(variance * costPerMl);
}

// ============================================================================
// Liquor-Specific Calculations
// ============================================================================

export interface LiquorStockBreakdown {
  fullBottles: number;
  looseMl: number;
  bottleSizeMl: number;
  totalMl: number;
}

export function decomposeLiquorStock(
  totalMl: number,
  bottleSizeMl: number
): LiquorStockBreakdown {
  if (totalMl < 0) throw new Error('totalMl must be >= 0');
  if (!isValidLiquorBottleSizeException(bottleSizeMl)) {
    throw new Error(`Invalid bottle size: ${bottleSizeMl}`);
  }
  
  const fullBottles = Math.floor(totalMl / bottleSizeMl);
  const looseMl = +(totalMl - fullBottles * bottleSizeMl).toFixed(3);
  
  return { fullBottles, looseMl, bottleSizeMl, totalMl };
}

export function composeLiquorStock(breakdown: LiquorStockBreakdown): number {
  return breakdown.fullBottles * breakdown.bottleSizeMl + breakdown.looseMl;
}

export function isValidLiquorBottleSizeException(ml: number): boolean {
  const validSizes = [2000, 1000, 750, 500, 375, 180, 90, 60];
  return validSizes.includes(ml);
}

// ============================================================================
// Exception Filtering & Sorting
// ============================================================================

export function filterExceptions(
  exceptions: ExceptionDetail[],
  filter: ExceptionFilter
): ExceptionDetail[] {
  return exceptions.filter(ex => {
    if (filter.category && ex.category !== filter.category) return false;
    if (filter.productId && ex.productId !== filter.productId) return false;
    if (filter.classification && ex.classification !== filter.classification) return false;
    if (filter.severity && ex.severity !== filter.severity) return false;
    if (filter.state && ex.state !== filter.state) return false;
    if (filter.assignedTo && ex.assignedTo !== filter.assignedTo) return false;
    
    if (filter.varianceDirection) {
      const variance = ex.varianceQty ?? 0;
      if (filter.varianceDirection === 'positive' && variance <= 0) return false;
      if (filter.varianceDirection === 'negative' && variance >= 0) return false;
      if (filter.varianceDirection === 'zero' && variance !== 0) return false;
    }
    
    if (filter.hasFinancialImpact !== undefined) {
      const hasImpact = ex.estimatedFinancialImpact !== undefined && ex.estimatedFinancialImpact !== undefined && ex.estimatedFinancialImpact !== 0;
      if (filter.hasFinancialImpact !== hasImpact) return false;
    }
    
    return true;
  });
}

export function sortExceptions(
  exceptions: ExceptionDetail[],
  sortBy: keyof ExceptionDetail = 'severity',
  sortOrder: 'asc' | 'desc' = 'desc'
): ExceptionDetail[] {
  const severityOrder: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    informational: 1,
  };

  return [...exceptions].sort((a, b) => {
    let aVal: any = a[sortBy];
    let bVal: any = b[sortBy];

    // Special handling for severity
    if (sortBy === 'severity') {
      aVal = severityOrder[a.severity] ?? 0;
      bVal = severityOrder[b.severity] ?? 0;
    }

    // Handle dates
    if (aVal instanceof Date && bVal instanceof Date) {
      aVal = aVal.getTime();
      bVal = bVal.getTime();
    }

    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

export function paginateExceptions(
  exceptions: ExceptionDetail[],
  page: number,
  pageSize: number
): { items: ExceptionDetail[]; total: number; page: number; pageSize: number; totalPages: number } {
  const total = exceptions.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = exceptions.slice(start, start + pageSize);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ============================================================================
// Recurrence Detection
// ============================================================================

export interface RecurrencePattern {
  productId: string;
  productName: string;
  classification: ExceptionClassification;
  count: number;
  firstDetected: Date;
  lastDetected: Date;
  daysBetween: number;
  averageInterval: number;
  isEscalating: boolean;
}

export function detectRecurrencePatterns(
  exceptions: ExceptionDetail[],
  minOccurrences: number = 3,
  windowDays: number = 30
): RecurrencePattern[] {
  // Group by product and classification
  const groups = new Map<string, ExceptionDetail[]>();
  
  for (const ex of exceptions) {
    const key = `${ex.productId}-${ex.classification}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ex);
  }

  const patterns: RecurrencePattern[] = [];

  for (const [key, exceptions] of groups) {
    if (exceptions.length < minOccurrences) continue;

    // Sort by date
    const sorted = [...exceptions].sort((a, b) => 
      a.lastDetectedDate.getTime() - b.lastDetectedDate.getTime()
    );

    const firstException = sorted[0];
    const lastException = sorted[sorted.length - 1];
    if (!firstException || !lastException) continue;

    const firstDetected = firstException.firstDetectedDate;
    const lastDetected = lastException.lastDetectedDate;
    const daysBetween = Math.floor(
      (lastDetected.getTime() - firstDetected.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageInterval = daysBetween / (sorted.length - 1);

    // Check if escalating (variance magnitude increasing)
    const variances = sorted.map(e => Math.abs(e.varianceQty ?? 0));
    const isEscalating = variances.length >= 3 && 
      (variances[variances.length - 1] ?? 0) > (variances[0] ?? 0) &&
      (variances[variances.length - 1] ?? 0) > (variances[Math.floor(variances.length / 2)] ?? 0);

    patterns.push({
      productId: firstException.productId,
      productName: firstException.productName,
      classification: firstException.classification,
      count: sorted.length,
      firstDetected,
      lastDetected,
      daysBetween,
      averageInterval,
      isEscalating,
    });
  }

  return patterns.sort((a, b) => b.count - a.count);
}

// ============================================================================
// Exception Filtering Helpers
// ============================================================================

export function getExceptionsByClassification(
  exceptions: ExceptionDetail[],
  classification: ExceptionClassification
): ExceptionDetail[] {
  return exceptions.filter(e => e.classification === classification);
}

export function getExceptionsBySeverity(
  exceptions: ExceptionDetail[],
  severity: ExceptionSeverity
): ExceptionDetail[] {
  return exceptions.filter(e => e.severity === severity);
}

export function getUnresolvedExceptions(exceptions: ExceptionDetail[]): ExceptionDetail[] {
  return exceptions.filter(e => 
    !['closed_approved', 'resolved_explained', 'corrected_adjustment'].includes(e.state)
  );
}

export function getHighPriorityExceptions(exceptions: ExceptionDetail[]): ExceptionDetail[] {
  return exceptions.filter(e => 
    ['high', 'critical'].includes(e.severity) &&
    !['closed_approved', 'resolved_explained', 'corrected_adjustment'].includes(e.state)
  );
}

export function getRepeatedDiscrepancies(
  exceptions: ExceptionDetail[],
  minCount: number = 3
): ExceptionDetail[] {
  return exceptions.filter(e => e.recurrenceCount >= minCount);
}

export function getFinancialImpactSummary(exceptions: ExceptionDetail[]): {
  totalImpact: number;
  byClassification: Record<string, number>;
  bySeverity: Record<string, number>;
  countWithCostData: number;
  countWithoutCostData: number;
} {
  const withCost = exceptions.filter(e => 
    e.estimatedFinancialImpact !== undefined && e.estimatedFinancialImpact !== undefined
  );
  const withoutCost = exceptions.filter(e => 
    e.estimatedFinancialImpact === undefined || e.estimatedFinancialImpact === undefined
  );

  const byClassification: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const ex of withCost) {
    const impact = ex.estimatedFinancialImpact ?? 0;
    byClassification[ex.classification] = (byClassification[ex.classification] ?? 0) + impact;
    bySeverity[ex.severity] = (bySeverity[ex.severity] ?? 0) + impact;
  }

  return {
    totalImpact: withCost.reduce((sum, e) => sum + (e.estimatedFinancialImpact ?? 0), 0),
    byClassification,
    bySeverity,
    countWithCostData: withCost.length,
    countWithoutCostData: withoutCost.length,
  };
}