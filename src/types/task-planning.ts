import type { AdvisorId } from './advisor';

export const TASK_PLANNING_BUCKETS = ['today', 'this_week', 'later'] as const;

export type TaskPlanningBucket = (typeof TASK_PLANNING_BUCKETS)[number];

export interface TaskPlanningAssignment {
  advisorId: AdvisorId;
  taskId: string;
  bucket: TaskPlanningBucket;
  updatedAt: string;
}

export type TaskPlanningStore = Record<string, TaskPlanningAssignment>;

export function getTaskPlanningKey(advisorId: AdvisorId, taskId: string): string {
  return `${advisorId}:${taskId}`;
}
