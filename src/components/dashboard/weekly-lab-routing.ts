import type { EnrichedTaskItem } from '../../state/selectors';
import type { TaskStatus } from '../../types/action-item';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { formatDateKey } from '../../utils/date';

export type WeeklyLabRoutePreset = Exclude<TaskListPreset, 'all_open'>;

export interface WeeklyLabRoute {
  preset: WeeklyLabRoutePreset;
  label: string;
}

export const WEEKLY_LAB_ROUTE_LABELS: Record<WeeklyLabRoutePreset, string> = {
  needs_triage: 'Needs Triage',
  carry_over: 'Carry Over',
  overdue: 'Overdue',
  weekly_focus: 'Weekly Focus',
};

export function isCarryOverTask(
  planningBucket: TaskPlanningBucket | null,
  planningUpdatedAt: string | null,
  currentDate: string,
): boolean {
  if (planningBucket !== 'today' || !planningUpdatedAt) {
    return false;
  }

  return formatDateKey(new Date(planningUpdatedAt)) < currentDate;
}

export function getTaskWeeklyLabRoute(input: {
  status: TaskStatus;
  planningBucket: TaskPlanningBucket | null;
  isCarryOver: boolean;
  isInWeeklyFocus: boolean;
  dueDate: string;
  currentDate: string;
}): WeeklyLabRoute | null {
  const {
    status,
    planningBucket,
    isCarryOver,
    isInWeeklyFocus,
    dueDate,
    currentDate,
  } = input;

  if (status !== 'open') {
    return null;
  }

  if (!planningBucket) {
    return {
      preset: 'needs_triage',
      label: WEEKLY_LAB_ROUTE_LABELS.needs_triage,
    };
  }

  if (isCarryOver) {
    return {
      preset: 'carry_over',
      label: WEEKLY_LAB_ROUTE_LABELS.carry_over,
    };
  }

  if (dueDate !== 'ongoing' && dueDate < currentDate) {
    return {
      preset: 'overdue',
      label: WEEKLY_LAB_ROUTE_LABELS.overdue,
    };
  }

  if (isInWeeklyFocus) {
    return {
      preset: 'weekly_focus',
      label: WEEKLY_LAB_ROUTE_LABELS.weekly_focus,
    };
  }

  return null;
}

export function getItemWeeklyLabRoute(
  item: EnrichedTaskItem,
  currentDate: string,
  isInWeeklyFocus: boolean,
): WeeklyLabRoute | null {
  return getTaskWeeklyLabRoute({
    status: item.status,
    planningBucket: item.planningBucket,
    isCarryOver: isCarryOverTask(item.planningBucket, item.planningUpdatedAt, currentDate),
    isInWeeklyFocus,
    dueDate: item.dueDate,
    currentDate,
  });
}
