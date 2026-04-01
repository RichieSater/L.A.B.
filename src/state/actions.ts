import type { AdvisorId } from '../types/advisor';
import type { AppState } from '../types/app-state';
import type { NormalizedSessionImport } from '../types/session';
import type { SharedMetricsStore } from '../types/metrics';
import type { TaskStatus } from '../types/action-item';
import type { QuickLogEntry } from '../types/quick-log';
import type { TaskPlanningBucket } from '../types/task-planning';
import type { DailyPlanningField } from '../types/daily-planning';
import type { WeeklyReviewField } from '../types/weekly-review';
import type { StrategicDashboardSectionKey, StrategicWinField } from '../types/strategic-dashboard';

export type AppAction =
  | { type: 'INITIALIZE'; payload: AppState }
  | { type: 'IMPORT_SESSION'; payload: { advisorId: AdvisorId; normalizedImport: NormalizedSessionImport } }
  | { type: 'UPDATE_TASK'; payload: { advisorId: AdvisorId; taskId: string; status: TaskStatus } }
  | { type: 'SET_TASK_PLAN_BUCKET'; payload: { advisorId: AdvisorId; taskId: string; bucket: TaskPlanningBucket } }
  | { type: 'CLEAR_TASK_PLAN_BUCKET'; payload: { advisorId: AdvisorId; taskId: string } }
  | {
      type: 'SET_DAILY_PLANNING_FIELD';
      payload: { date: string; field: DailyPlanningField; value: string };
    }
  | { type: 'COMPLETE_DAILY_PLAN'; payload: { date: string } }
  | {
      type: 'ADD_WEEKLY_FOCUS_TASK';
      payload: {
        advisorId: AdvisorId;
        taskId: string;
        weekStart: string;
        carriedForwardFromWeekStart?: string | null;
      };
    }
  | { type: 'REMOVE_WEEKLY_FOCUS_TASK'; payload: { advisorId: AdvisorId; taskId: string; weekStart: string } }
  | {
      type: 'SET_WEEKLY_REVIEW_FIELD';
      payload: { weekStart: string; field: WeeklyReviewField; value: string };
    }
  | { type: 'COMPLETE_WEEKLY_REVIEW'; payload: { weekStart: string } }
  | {
      type: 'SET_STRATEGIC_GOAL_SLOT';
      payload: { year: number; sectionKey: StrategicDashboardSectionKey; index: number; text: string };
    }
  | {
      type: 'TOGGLE_STRATEGIC_GOAL_COMPLETED';
      payload: { year: number; sectionKey: StrategicDashboardSectionKey; index: number };
    }
  | {
      type: 'SET_STRATEGIC_WIN';
      payload: { year: number; field: StrategicWinField; index: number; value: string };
    }
  | {
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK';
      payload: {
        year: number;
        sectionKey: StrategicDashboardSectionKey;
        index: number;
        advisorId: AdvisorId;
        bucket: TaskPlanningBucket;
        addToWeeklyFocusWeekStart?: string | null;
      };
    }
  | { type: 'UPDATE_SHARED_METRICS'; payload: Partial<SharedMetricsStore> }
  | { type: 'UPDATE_ADVISOR_NARRATIVE'; payload: { advisorId: AdvisorId; narrative: string } }
  | { type: 'RESET_ADVISOR'; payload: { advisorId: AdvisorId } }
  | { type: 'ADD_QUICK_LOG'; payload: QuickLogEntry }
  | { type: 'TOGGLE_ADVISOR_ACTIVATION'; payload: { advisorId: AdvisorId } };
