/**
 * Formatting utilities for agricultural data
 */

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M farms`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K farms`;
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatAcres(acres: number): string {
  if (acres === 0) return '0 acres';
  if (acres >= 1_000_000) {
    return `${(acres / 1_000_000).toFixed(2)}M acres`;
  }
  if (acres >= 1_000) {
    return `${(acres / 1_000).toFixed(1)}K acres`;
  }
  return `${formatNumber(acres)} acres`;
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyMillions(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return formatCurrency(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}