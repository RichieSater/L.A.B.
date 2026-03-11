import type { AdvisorConfig } from '../../types/advisor';
import type { AppState } from '../../types/app-state';
import type { SharedMetricsStore } from '../../types/metrics';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { selectActivatedAdvisorIds } from '../../state/selectors';
import { formatDaysAgo } from '../../utils/date';

export function buildCrossAdvisorSection(
  config: AdvisorConfig,
  sharedMetrics: SharedMetricsStore,
  appState?: AppState,
): string {
  let section = '[CROSS-DOMAIN CONTEXT]\n';

  // Shared metrics
  const relevantMetrics = config.consumesMetrics
    .filter(metricId => sharedMetrics[metricId])
    .map(metricId => {
      const entry = sharedMetrics[metricId];
      return {
        metricId,
        value: entry.value,
        date: entry.date,
        source: entry.source,
      };
    });

  if (relevantMetrics.length > 0) {
    for (const metric of relevantMetrics) {
      const sourceLabel = metric.source === 'session' ? 'session export' : `${metric.source} advisor`;
      section += `- ${metric.metricId}: ${metric.value} (from ${sourceLabel}, ${formatDaysAgo(metric.date)})\n`;
    }
  } else {
    section += 'No cross-advisor metrics available yet.\n';
  }

  if (!appState) return section;

  const activatedIds = selectActivatedAdvisorIds(appState);

  // Dashboard summary
  let totalOpen = 0;
  let totalOverdue = 0;
  const now = new Date().toISOString().split('T')[0];

  for (const id of activatedIds) {
    const advisor = appState.advisors[id];
    for (const item of advisor.actionItems) {
      if (item.status === 'open') {
        totalOpen++;
        if (item.due !== 'ongoing' && item.due < now) {
          totalOverdue++;
        }
      }
    }
  }

  section += `\n[DASHBOARD SUMMARY]\n`;
  section += `Total open tasks across all advisors: ${totalOpen}\n`;
  section += `Overdue tasks: ${totalOverdue}\n`;

  // Cross-advisor tasks
  section += `\n[CROSS-ADVISOR TASKS]\n`;
  section += 'Other advisors have assigned the following open tasks. Be aware of these when planning.\n\n';

  let hasAnyTasks = false;
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  for (const id of activatedIds) {
    if (id === config.id) continue;
    const advisor = appState.advisors[id];
    const otherConfig = ADVISOR_CONFIGS[id];
    const openTasks = advisor.actionItems.filter(i => i.status === 'open');

    if (openTasks.length === 0) continue;
    hasAnyTasks = true;

    const sorted = [...openTasks].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.due === 'ongoing') return 1;
      if (b.due === 'ongoing') return -1;
      return a.due.localeCompare(b.due);
    });

    const allItems = advisor.actionItems;
    const completedCount = allItems.filter(i => i.status === 'completed').length;
    const completionRate = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;
    section += `${otherConfig.shortName} (${openTasks.length} open, ${completionRate}% completion rate):\n`;
    for (const item of sorted.slice(0, 3)) {
      section += `- [${item.id}] ${item.task} (due: ${item.due}, priority: ${item.priority})\n`;
    }
    if (openTasks.length > 3) {
      section += `  ... and ${openTasks.length - 3} more\n`;
    }
    section += '\n';
  }

  if (!hasAnyTasks) {
    section += 'No open tasks from other advisors.\n';
  }

  return section;
}
