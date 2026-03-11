import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { computeTrend, trendArrow } from '../../utils/trends';

export function buildMetricsSection(config: AdvisorConfig, state: AdvisorState): string {
  const entries = Object.entries(state.metricsLatest);

  if (entries.length === 0) {
    return `[CURRENT METRICS]
No metrics recorded yet. This is the first session.`;
  }

  let section = '[CURRENT METRICS]\n';

  for (const [metricId, value] of entries) {
    const def = config.metricDefinitions.find(d => d.id === metricId);
    const label = def?.label ?? metricId;
    const unit = def?.unit ?? '';

    const trend = computeTrend(metricId, state.metricsHistory, value);
    const arrow = trendArrow(trend.direction);

    let displayValue = String(value);
    if (def?.type === 'currency' && typeof value === 'number') {
      displayValue = `$${value.toLocaleString()}`;
    } else if (def?.type === 'percentage' && typeof value === 'number') {
      displayValue = `${value}%`;
    } else if (unit && typeof value === 'number') {
      displayValue = `${value} ${unit}`;
    }

    section += `- ${label}: ${displayValue} ${arrow} (${trend.label})\n`;
  }

  return section;
}
