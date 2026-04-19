import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import { computeTrend, trendArrow } from '../../utils/trends';

interface MetricsSummaryProps {
  config: AdvisorConfig;
  state: AdvisorState;
}

export function MetricsSummary({ config, state }: MetricsSummaryProps) {
  const entries = Object.entries(state.metricsLatest);

  if (entries.length === 0) {
    return (
      <div className="lab-empty-state py-4 text-center text-sm">
        No metrics recorded yet. Complete a session to start tracking.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([metricId, value]) => {
        const def = config.metricDefinitions.find(d => d.id === metricId);
        const label = def?.label ?? metricId;
        const trend = computeTrend(metricId, state.metricsHistory, value);
        const arrow = trendArrow(trend.direction);

        let displayValue = String(value);
        if (def?.type === 'currency' && typeof value === 'number') {
          displayValue = `$${value.toLocaleString()}`;
        } else if (def?.type === 'percentage' && typeof value === 'number') {
          displayValue = `${value}%`;
        }

        const trendColor = trend.direction === 'up' ? 'text-[color:var(--lab-success)]' :
          trend.direction === 'down' ? 'text-[color:var(--lab-danger)]' :
          'text-[color:var(--lab-text-dim)]';

        return (
          <div key={metricId} className="lab-subpanel lab-subpanel--soft p-3">
            <div className="mb-1 text-xs uppercase tracking-[0.16em] text-[color:var(--lab-text-dim)]">{label}</div>
            <div className="text-lg font-semibold text-[color:var(--lab-text)]">{displayValue}</div>
            <div className={`text-xs ${trendColor} mt-0.5`}>
              {arrow} {trend.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
