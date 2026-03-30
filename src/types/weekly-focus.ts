import type { AdvisorId } from './advisor';

export const MAX_WEEKLY_FOCUS_ITEMS = 3;
export const MAX_WEEKLY_FOCUS_HISTORY_WEEKS = 8;

export interface WeeklyFocusTaskRef {
  advisorId: AdvisorId;
  taskId: string;
  addedAt: string;
  carriedForwardFromWeekStart: string | null;
}

export interface WeeklyFocusWeek {
  weekStart: string;
  items: WeeklyFocusTaskRef[];
}

export interface WeeklyFocusState {
  weeks: WeeklyFocusWeek[];
}

export function createDefaultWeeklyFocusState(): WeeklyFocusState {
  return {
    weeks: [],
  };
}
