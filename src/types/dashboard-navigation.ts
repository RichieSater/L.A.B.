import type { AdvisorId } from './advisor';

export type DashboardTab = 'week' | 'advisors' | 'calendar';

export type TaskListPreset =
  | 'all_open'
  | 'needs_triage'
  | 'carry_over'
  | 'overdue'
  | 'weekly_focus';

export interface TaskDashboardNavigationRequest {
  requestKey: string;
  taskListPreset?: TaskListPreset;
  advisorId?: AdvisorId | 'all';
}

export interface DashboardNavigationState {
  dashboard?: {
    tab?: DashboardTab;
    taskList?: Omit<TaskDashboardNavigationRequest, 'requestKey'>;
  };
}
