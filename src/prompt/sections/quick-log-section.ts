import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import type { QuickLogEntry } from '../../types/quick-log';

export function buildQuickLogSection(
  config: AdvisorConfig,
  state: AdvisorState,
  quickLogs: QuickLogEntry[],
): string {
  const sinceDate = state.lastSessionDate;
  const relevantLogs = quickLogs
    .filter(
      log =>
        log.advisorId === config.id &&
        (!sinceDate || log.date > sinceDate),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (relevantLogs.length === 0) {
    return '';
  }

  let section = `[QUICK LOG DATA SINCE LAST SESSION]\n`;
  section += `${relevantLogs.length} quick log entries recorded:\n`;

  for (const log of relevantLogs) {
    section += `\n${log.date}:`;
    for (const [metricId, value] of Object.entries(log.logs)) {
      const def = (state.checkInConfig ?? config.metricDefinitions).find(d => d.id === metricId);
      const label = def?.label ?? metricId;
      const unit = def?.unit ? ` ${def.unit}` : '';
      section += `\n  - ${label}: ${value}${unit}`;
    }
  }

  // Add trend summary if 3+ entries
  if (relevantLogs.length >= 3) {
    const quickLoggableMetrics = state.checkInConfig?.length
      ? state.checkInConfig
      : config.metricDefinitions.filter(m => m.quickLoggable);
    const trendLines: string[] = [];

    for (const metric of quickLoggableMetrics) {
      const values = relevantLogs
        .map(log => log.logs[metric.id])
        .filter((v): v is number => v !== undefined && typeof v === 'number');

      if (values.length >= 3) {
        const first = values[0];
        const last = values[values.length - 1];
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const direction =
          last > first ? 'trending up' : last < first ? 'trending down' : 'stable';
        trendLines.push(`  - ${metric.label}: avg ${avg.toFixed(1)}, ${direction}`);
      }
    }

    if (trendLines.length > 0) {
      section += `\n\nTrend summary:\n${trendLines.join('\n')}`;
    }
  }

  return section;
}
