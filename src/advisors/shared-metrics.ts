import type { AdvisorId } from '../types/advisor';
import type { SharedMetricConfig } from '../types/metrics';

export const SHARED_METRICS_MAP: SharedMetricConfig[] = [
  {
    metricId: 'sleep_hours',
    owner: 'fitness',
    consumers: ['performance', 'prioritization', 'career', 'financial', 'creativity', 'therapist'],
  },
  {
    metricId: 'daily_energy',
    owner: 'performance',
    consumers: ['fitness', 'prioritization', 'career', 'therapist'],
  },
  {
    metricId: 'confidence',
    owner: 'performance',
    consumers: ['career', 'creativity', 'therapist'],
  },
  {
    metricId: 'mood',
    owner: null, // sourced from ALL session exports
    consumers: ['performance', 'prioritization', 'therapist'],
  },
  {
    metricId: 'cash_on_hand',
    owner: 'financial',
    consumers: ['career', 'performance'],
  },
  {
    metricId: 'runway_months',
    owner: 'financial',
    consumers: ['career', 'performance'],
  },
  {
    metricId: 'open_loops',
    owner: 'prioritization',
    consumers: ['performance', 'creativity', 'therapist'],
  },
  {
    metricId: 'job_pipeline_status',
    owner: 'career',
    consumers: ['financial'],
  },
  {
    metricId: 'mood_rating',
    owner: 'therapist',
    consumers: ['performance', 'prioritization', 'career', 'fitness'],
  },
  {
    metricId: 'anxiety_level',
    owner: 'therapist',
    consumers: ['performance', 'prioritization', 'career'],
  },
  {
    metricId: 'stress_level',
    owner: 'therapist',
    consumers: ['performance', 'fitness', 'prioritization'],
  },
];

/**
 * Get the shared metrics that a given advisor consumes (reads from other advisors).
 */
export function getConsumedMetrics(advisorId: AdvisorId): string[] {
  return SHARED_METRICS_MAP
    .filter(m => m.consumers.includes(advisorId))
    .map(m => m.metricId);
}

/**
 * Get the shared metrics that a given advisor produces (writes for other advisors).
 */
export function getProducedMetrics(advisorId: AdvisorId): string[] {
  return SHARED_METRICS_MAP
    .filter(m => m.owner === advisorId)
    .map(m => m.metricId);
}
