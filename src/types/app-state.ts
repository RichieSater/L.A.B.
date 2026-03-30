import type { AdvisorId, AdvisorState } from './advisor';
import type { SharedMetricsStore } from './metrics';
import type { QuickLogEntry } from './quick-log';
import type { TaskPlanningStore } from './task-planning';
import type { DailyPlanningState } from './daily-planning';
import type { WeeklyFocusState } from './weekly-focus';
import type { WeeklyReviewState } from './weekly-review';

export interface AppState {
  advisors: Record<AdvisorId, AdvisorState>;
  sharedMetrics: SharedMetricsStore;
  quickLogs: QuickLogEntry[];
  taskPlanning: TaskPlanningStore;
  dailyPlanning: DailyPlanningState;
  weeklyFocus: WeeklyFocusState;
  weeklyReview: WeeklyReviewState;
  initialized: boolean;
  schemaVersion: number;
}
