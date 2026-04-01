import type { AdvisorId } from './advisor';

export type DashboardTab = 'week' | 'advisors' | 'compass' | 'calendar';
export type DashboardAvailableTabs = readonly DashboardTab[];

export type TaskListPreset =
  | 'all_open'
  | 'needs_triage'
  | 'carry_over'
  | 'overdue'
  | 'weekly_focus';

export interface TaskDashboardAttentionContext {
  advisorName: string;
  headline: string;
  reason: string;
  planningLabel: string | null;
  planningCount: number;
}

export interface TaskDashboardNavigationRequest {
  requestKey: string;
  taskListPreset?: TaskListPreset;
  advisorId?: AdvisorId | 'all';
  attentionContext?: TaskDashboardAttentionContext | null;
}

export interface DashboardNavigationState {
  dashboard?: {
    tab?: DashboardTab;
    taskList?: Omit<TaskDashboardNavigationRequest, 'requestKey'>;
  };
}
