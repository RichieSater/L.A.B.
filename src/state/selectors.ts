import type { AppState } from '../types/app-state';
import type { AdvisorId } from '../types/advisor';
import type { HabitItem, TaskItem } from '../types/action-item';
import type { ScheduleEntry } from '../types/schedule';
import type { QuickLogEntry } from '../types/quick-log';
import { ADVISOR_CONFIGS, ACTIVE_ADVISOR_IDS } from '../advisors/registry';
import { daysAgo, daysBetween, today } from '../utils/date';

export type DomainHealth = 'healthy' | 'attention' | 'critical';

const PINNED_ADVISOR_ORDER: AdvisorId[] = ['performance', 'prioritization'];

/**
 * Returns advisor IDs that are both in ACTIVE_ADVISOR_IDS (phase-gated)
 * AND activated by the user.
 */
export function selectActivatedAdvisorIds(state: AppState): AdvisorId[] {
  return ACTIVE_ADVISOR_IDS.filter(id => state.advisors[id]?.activated);
}

/**
 * Returns advisor IDs that are in ACTIVE_ADVISOR_IDS but NOT activated.
 * Used for the "available to activate" section on the dashboard.
 */
export function selectInactiveAdvisorIds(state: AppState): AdvisorId[] {
  return ACTIVE_ADVISOR_IDS.filter(id => !state.advisors[id]?.activated);
}

export function selectScheduleEntries(state: AppState): ScheduleEntry[] {
  const now = today();
  const entries: ScheduleEntry[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    let isOverdue = false;
    let daysUntilDue = 0;

    if (!advisor.nextDueDate) {
      // Never had a session — due now
      isOverdue = true;
      daysUntilDue = 0;
    } else {
      daysUntilDue = daysBetween(now, advisor.nextDueDate);
      isOverdue = daysUntilDue < -config.defaultCadence.windowDays;
    }

    entries.push({
      advisorId: id,
      nextDueDate: advisor.nextDueDate,
      isOverdue,
      daysUntilDue,
      streak: advisor.streak,
      lastSessionDate: advisor.lastSessionDate,
    });
  }

  // Sort: overdue first (by most overdue), then by days until due ascending
  return entries.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
}

export function selectAdvisorsByUrgency(state: AppState): AdvisorId[] {
  return selectScheduleEntries(state).map(e => e.advisorId);
}

export function selectAdvisorsWithPinnedOrder(state: AppState): AdvisorId[] {
  const urgencySorted = selectAdvisorsByUrgency(state);
  const pinned = PINNED_ADVISOR_ORDER.filter(id => urgencySorted.includes(id));
  const rest = urgencySorted.filter(id => !PINNED_ADVISOR_ORDER.includes(id));
  return [...pinned, ...rest];
}

export interface EnrichedTaskItem extends TaskItem {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
}

export function selectAllTaskItems(state: AppState): EnrichedTaskItem[] {
  const items: EnrichedTaskItem[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];
    for (const item of advisor.tasks) {
      items.push({
        ...item,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
      });
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    if (a.dueDate === 'ongoing') return 1;
    if (b.dueDate === 'ongoing') return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export interface EnrichedHabitItem extends HabitItem {
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
}

export function selectAllHabits(state: AppState): EnrichedHabitItem[] {
  const habits: EnrichedHabitItem[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];
    for (const habit of advisor.habits) {
      habits.push({
        ...habit,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
      });
    }
  }

  return habits.sort((a, b) => a.name.localeCompare(b.name));
}

export interface CalendarEvent {
  date: string;
  type: 'task' | 'session' | 'scheduled';
  label: string;
  advisorId: AdvisorId;
  advisorIcon: string;
  advisorName: string;
  advisorColor: string;
  priority?: 'high' | 'medium' | 'low';
  scheduledTime?: string; // ISO time for scheduled sessions
  itemId?: string; // action item ID for task completion toggle
}

export function selectCalendarEvents(state: AppState): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    // Task due dates
    for (const item of advisor.tasks) {
      if (item.status === 'open' && item.dueDate !== 'ongoing') {
        events.push({
          date: item.dueDate,
          type: 'task',
          label: item.task,
          advisorId: id,
          advisorIcon: config.icon,
          advisorName: config.shortName,
          advisorColor: config.domainColor,
          priority: item.priority,
          itemId: item.id,
        });
      }
    }

    // Next session due date
    if (advisor.nextDueDate) {
      events.push({
        date: advisor.nextDueDate,
        type: 'session',
        label: `${config.shortName} session due`,
        advisorId: id,
        advisorIcon: config.icon,
        advisorName: config.shortName,
        advisorColor: config.domainColor,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function selectDomainHealth(state: AppState): Record<AdvisorId, DomainHealth> {
  const health = {} as Record<AdvisorId, DomainHealth>;
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    const config = ADVISOR_CONFIGS[id];

    // No sessions ever = attention
    if (!advisor.lastSessionDate) {
      health[id] = 'attention';
      continue;
    }

    const daysSinceSession = daysAgo(advisor.lastSessionDate);
    const interval = config.defaultCadence.intervalDays;
    const window = config.defaultCadence.windowDays;

    if (daysSinceSession > interval + window) {
      health[id] = 'critical';
    } else if (daysSinceSession > interval) {
      health[id] = 'attention';
    } else {
      health[id] = 'healthy';
    }
  }

  return health;
}

export function selectOverallStreak(state: AppState): number {
  const activatedIds = selectActivatedAdvisorIds(state);
  const streaks = activatedIds.map(id => state.advisors[id].streak);
  if (streaks.length === 0) return 0;
  return Math.min(...streaks);
}

export function selectAllOpenTasks(
  state: AppState,
): (TaskItem & { advisorId: AdvisorId })[] {
  const items: (TaskItem & { advisorId: AdvisorId })[] = [];
  const activatedIds = selectActivatedAdvisorIds(state);

  for (const id of activatedIds) {
    const advisor = state.advisors[id];
    for (const item of advisor.tasks) {
      if (item.status === 'open') {
        items.push({ ...item, advisorId: id });
      }
    }
  }

  // Sort by priority (high first) then by due date
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    if (a.dueDate === 'ongoing') return 1;
    if (b.dueDate === 'ongoing') return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function selectAdvisorStatus(
  state: AppState,
  advisorId: AdvisorId,
): 'due' | 'overdue' | 'upcoming' | 'completed' {
  const advisor = state.advisors[advisorId];
  const config = ADVISOR_CONFIGS[advisorId];

  if (!advisor.lastSessionDate) return 'due';

  const now = today();
  if (!advisor.nextDueDate) return 'due';

  const daysUntil = daysBetween(now, advisor.nextDueDate);

  if (daysUntil < -config.defaultCadence.windowDays) return 'overdue';
  if (daysUntil <= 0) return 'due';
  if (daysUntil <= 2) return 'upcoming';
  return 'completed';
}

export function selectQuickLogsSince(
  state: AppState,
  advisorId: AdvisorId,
  sinceDate: string | null,
): QuickLogEntry[] {
  return state.quickLogs.filter(
    log => log.advisorId === advisorId && (!sinceDate || log.date > sinceDate),
  );
}

export function selectLastQuickLogDate(
  state: AppState,
  advisorId: AdvisorId,
): string | null {
  const logs = state.quickLogs.filter(log => log.advisorId === advisorId);
  if (logs.length === 0) return null;
  return logs[logs.length - 1].date;
}

export function selectSupportsQuickLog(advisorId: AdvisorId): boolean {
  const config = ADVISOR_CONFIGS[advisorId];
  if (!config) return false;
  if (config.defaultCadence.quickLog === 'none') return false;
  return config.metricDefinitions.some(m => m.quickLoggable);
}
