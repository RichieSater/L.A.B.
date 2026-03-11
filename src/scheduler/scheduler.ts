import type { AdvisorId, AdvisorConfig, AdvisorState } from '../types/advisor';
import type { ScheduleEntry } from '../types/schedule';
import { daysBetween, today as getToday } from '../utils/date';

export function computeSchedule(
  advisorConfigs: Record<string, AdvisorConfig>,
  advisorStates: Record<string, AdvisorState>,
  activeIds: AdvisorId[],
): ScheduleEntry[] {
  const now = getToday();
  const entries: ScheduleEntry[] = [];

  for (const id of activeIds) {
    const config = advisorConfigs[id];
    const state = advisorStates[id];
    if (!config || !state) continue;

    let isOverdue = false;
    let daysUntilDue = 0;

    if (!state.nextDueDate || !state.lastSessionDate) {
      // No sessions yet — due now
      isOverdue = false;
      daysUntilDue = 0;
    } else {
      daysUntilDue = daysBetween(now, state.nextDueDate);
      isOverdue = daysUntilDue < -config.defaultCadence.windowDays;
    }

    entries.push({
      advisorId: id,
      nextDueDate: state.nextDueDate,
      isOverdue,
      daysUntilDue,
      streak: state.streak,
      lastSessionDate: state.lastSessionDate,
    });
  }

  // Sort: overdue first, then due today, then by soonest upcoming
  return entries.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
}
