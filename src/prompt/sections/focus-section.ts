import type { AdvisorConfig, AdvisorState } from '../../types/advisor';
import type { SharedMetricsStore } from '../../types/metrics';
import { daysAgo, isOverdue } from '../../utils/date';

export function buildFocusSection(
  config: AdvisorConfig,
  state: AdvisorState,
  sharedMetrics: SharedMetricsStore,
): string {
  const suggestions: string[] = [];

  // First session — suggest onboarding
  if (!state.lastSessionDate) {
    suggestions.push('This is your first session with this advisor. Establish a baseline: share your current situation, goals, and constraints.');
    return formatFocusSection(suggestions);
  }

  // Overdue action items
  const overdueItems = state.tasks.filter(
    item => item.status === 'open' && item.dueDate !== 'ongoing' && isOverdue(item.dueDate),
  );
  if (overdueItems.length > 0) {
    const worstOverdue = overdueItems.sort((a, b) => daysAgo(b.dueDate) - daysAgo(a.dueDate))[0];
    suggestions.push(
      `${overdueItems.length} action item(s) overdue. Most urgent: "${worstOverdue.task}" (${daysAgo(worstOverdue.dueDate)} days overdue). Review and either complete, defer, or close.`,
    );
  }

  // Declining metrics (check if most recent 2 entries show decline for numeric metrics)
  for (const [metricId, value] of Object.entries(state.metricsLatest)) {
    if (typeof value !== 'number') continue;
    const history = state.metricsHistory
      .filter(h => h.values[metricId] !== undefined && typeof h.values[metricId] === 'number')
      .sort((a, b) => b.date.localeCompare(a.date));

    if (history.length >= 2) {
      const prev = history[0].values[metricId] as number;
      const prevPrev = history[1].values[metricId] as number;
      if (value < prev && prev < prevPrev) {
        const def = config.metricDefinitions.find(d => d.id === metricId);
        suggestions.push(`${def?.label ?? metricId} has been declining for 2+ sessions. Investigate and address.`);
      }
    }
  }

  // Cross-advisor stress signals
  const energy = sharedMetrics['daily_energy'];
  const mood = sharedMetrics['mood'];
  if (energy && typeof energy.value === 'number' && energy.value <= 4) {
    suggestions.push('Low energy reported from cross-domain signals. Consider whether this is affecting this domain.');
  }
  if (mood && typeof mood.value === 'string' && ['stressed', 'anxious', 'low', 'overwhelmed', 'frustrated'].includes(mood.value.toLowerCase())) {
    suggestions.push(`Mood is "${mood.value}". Account for emotional state when setting this session's expectations.`);
  }

  // Default if no specific suggestions
  if (suggestions.length === 0) {
    suggestions.push('Standard check-in. Review progress on open items and update metrics.');
  }

  return formatFocusSection(suggestions);
}

function formatFocusSection(suggestions: string[]): string {
  let section = "[TODAY'S SUGGESTED FOCUS]\n";
  suggestions.forEach((s, i) => {
    section += `${i + 1}. ${s}\n`;
  });
  return section;
}
