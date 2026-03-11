import type { AdvisorId } from './advisor';

export type MetricType = 'number' | 'rating' | 'currency' | 'percentage' | 'binary';

export interface MetricDefinition {
  id: string;
  label: string;
  type: MetricType;
  unit?: string;
  min?: number;
  max?: number;
  quickLoggable?: boolean;
}

export interface MetricHistoryEntry {
  date: string;
  values: Record<string, number | string>;
}

export interface SharedMetricConfig {
  metricId: string;
  owner: AdvisorId | null; // null = sourced from all session exports
  consumers: AdvisorId[];
}

export type SharedMetricsStore = Record<string, {
  value: number | string;
  date: string;
  source: AdvisorId | 'session';
}>;
