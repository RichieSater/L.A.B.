export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'completed' | 'deferred' | 'closed';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitCadence = 'daily' | 'weekly';

export interface TaskItem {
  id: string;
  task: string;
  dueDate: string | 'ongoing';
  due?: string | 'ongoing';
  priority: TaskPriority;
  status: TaskStatus;
  createdDate: string;
  completedDate?: string;
  deferredReason?: string;
  sourceSessionDate?: string;
}

export interface HabitItem {
  id: string;
  name: string;
  cadence: HabitCadence;
  targetCount: number;
  unit?: string;
  status: HabitStatus;
  createdDate: string;
  archivedDate?: string;
  sourceSessionDate?: string;
}

export type ActionItemPriority = TaskPriority;
export type ActionItemStatus = TaskStatus;
export type ActionItem = TaskItem;
