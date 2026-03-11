import type { MetricHistoryEntry } from '../types/metrics';

export type TrendDirection = 'up' | 'down' | 'flat' | 'new';

export interface MetricTrend {
  direction: TrendDirection;
  currentValue: number | string;
  previousValue?: number | string;
  label: string;
}

export function computeTrend(
  metricId: string,
  history: MetricHistoryEntry[],
  currentValue: number | string,
): MetricTrend {
  // Find the most recent historical value that differs from current date
  const previousEntries = history
    .filter(entry => entry.values[metricId] !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (previousEntries.length === 0) {
    return { direction: 'new', currentValue, label: 'new' };
  }

  const previousValue = previousEntries[0].values[metricId];

  if (typeof currentValue === 'string' || typeof previousValue === 'string') {
    return {
      direction: currentValue === previousValue ? 'flat' : 'up',
      currentValue,
      previousValue,
      label: currentValue === previousValue ? 'unchanged' : 'changed',
    };
  }

  const diff = currentValue - (previousValue as number);
  if (Math.abs(diff) < 0.01) {
    return { direction: 'flat', currentValue, previousValue, label: 'flat' };
  }

  const direction: TrendDirection = diff > 0 ? 'up' : 'down';
  const absDiff = Math.abs(diff);
  const label = `${direction === 'up' ? '+' : '-'}${Number.isInteger(absDiff) ? absDiff : absDiff.toFixed(1)} from ${previousValue}`;

  return { direction, currentValue, previousValue, label };
}

export function trendArrow(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return '\u2191';
    case 'down': return '\u2193';
    case 'flat': return '\u2192';
    case 'new': return '\u2022';
  }
}
