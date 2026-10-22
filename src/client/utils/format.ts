/**
 * Formatting utilities for Deepa Inventory
 */

export function formatNumber(value: number | null | undefined, options?: {
  decimals?: number;
  useGrouping?: boolean;
  compact?: boolean;
}): string {
  if (value === null || value === undefined || !isFinite(value)) {
    return '—';
  }

  const { decimals = 0, useGrouping = true, compact = false } = options || {};

  if (compact && Math.abs(value) >= 1000) {
    return formatCompactNumber(value);
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1) + 'Cr';
  }
  if (value >= 100000) {
    return (value / 100000).toFixed(1) + 'L';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

export function formatCurrency(value: number | null | undefined, currency = 'INR'): string {
  if (value === null || value === undefined || !isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatQuantity(
  quantity: number, 
  unit: string, 
  options?: { 
    showUnit?: boolean; 
    decimals?: number;
    isLiquor?: boolean;
    bottleSizeMl?: number;
  }
): string {
  const { showUnit = true, decimals = 0, isLiquor = false, bottleSizeMl } = options || {};

  if (!isFinite(quantity)) return '—';

  let formatted = formatNumber(quantity, { decimals });

  if (isLiquor && bottleSizeMl) {
    const fullBottles = Math.floor(quantity / bottleSizeMl);
    const looseMl = quantity % bottleSizeMl;
    formatted = `${formatNumber(fullBottles)} btl ${formatNumber(looseMl)} ml`;
  }

  return showUnit ? `${formatted} ${unit}` : formatted;
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(d);
}

export function formatPercentage(value: number, decimals = 1): string {
  if (!isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatVariance(variance: number | null | undefined, unit: string): string {
  if (variance === null || variance === undefined || !isFinite(variance)) return '—';
  
  const sign = variance > 0 ? '+' : '';
  return `${sign}${formatNumber(variance)} ${unit}`;
}

export function getStockStatus(
  quantity: number, 
  reorderLevel: number | null, 
  isLiquor = false
): 'in-stock' | 'low-stock' | 'critical-stock' | 'out-of-stock' | 'normal' {
  if (quantity <= 0) return 'out-of-stock';
  if (!reorderLevel || reorderLevel <= 0) return 'in-stock';
  
  const threshold = isLiquor ? reorderLevel * 1.5 : reorderLevel;
  const criticalThreshold = isLiquor ? reorderLevel : reorderLevel * 0.5;
  
  if (quantity <= criticalThreshold) return 'critical-stock';
  if (quantity <= threshold) return 'low-stock';
  return 'in-stock';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function formatBarcode(barcode: string): string {
  // Format barcode for display (groups of 4)
  return barcode.replace(/(.{4})/g, '$1 ').trim();
}

export function parseQuantity(input: string, unit: string): number | null {
  const cleaned = input.replace(/[^\d.-]/g, '');
  const value = parseFloat(cleaned);
  return isFinite(value) && value >= 0 ? value : null;
}