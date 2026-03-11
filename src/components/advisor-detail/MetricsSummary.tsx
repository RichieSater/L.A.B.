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
      <div className="text-sm text-gray-500 py-4 text-center">
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

        const trendColor = trend.direction === 'up' ? 'text-green-400' :
          trend.direction === 'down' ? 'text-red-400' :
          'text-gray-500';

        return (
          <div key={metricId} className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-semibold text-gray-200">{displayValue}</div>
            <div className={`text-xs ${trendColor} mt-0.5`}>
              {arrow} {trend.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
